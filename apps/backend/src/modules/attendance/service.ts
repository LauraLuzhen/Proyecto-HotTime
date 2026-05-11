import { httpError } from "@/lib/httpError";
import * as organizationRepo from "@/modules/organization/repository";
import type {
  AttendanceClockResponse,
  AttendanceType,
  ClockInDto,
  ClockOutDto,
  CreateAttendanceDto,
  CreateAttendanceResponse,
  DeleteAttendanceResponse,
  GetAttendanceCalendarDto,
  GetAttendanceCalendarResponse,
  GetAttendanceResponse,
  GetAttendancesDto,
  GetAttendancesResponse,
  UpdateAttendanceDto,
  UpdateAttendanceResponse,
} from "@hottime/types";

import * as repo from "./repository";

const PRIVILEGED_ROLES = new Set(["ADMIN", "MANAGER"]);

function isPrivilegedRole(role: string) {
  return PRIVILEGED_ROLES.has(role);
}

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfWeek(start: Date) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEndOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function resolveShift(shiftId: number, organizationId: number) {
  const shift = await repo.getShiftById(shiftId, organizationId);

  if (!shift) {
    throw httpError("Shift not found", 404, "SHIFT_NOT_FOUND");
  }

  return shift;
}

async function resolveOrganizationLocation(organizationId: number) {
  const organization = await organizationRepo.findById(organizationId);

  if (
    !organization ||
    organization.latitude === null ||
    organization.longitude === null ||
    organization.allowedRadiusMeters === null
  ) {
    throw httpError(
      "Organization location not configured",
      400,
      "ORGANIZATION_LOCATION_NOT_CONFIGURED"
    );
  }

  return organization;
}

async function ensureWithinOrganizationRadius(
  organizationId: number,
  latitude: number,
  longitude: number
) {
  const organization = await resolveOrganizationLocation(organizationId);
  const organizationLatitude = organization.latitude!;
  const organizationLongitude = organization.longitude!;
  const organizationRadius = organization.allowedRadiusMeters!;
  const distanceMeters = getDistanceMeters(
    latitude,
    longitude,
    organizationLatitude,
    organizationLongitude
  );

  if (distanceMeters > organizationRadius) {
    throw httpError(
      "Attendance location out of range",
      403,
      "ATTENDANCE_LOCATION_OUT_OF_RANGE"
    );
  }

  return distanceMeters;
}

async function ensureUniqueAttendance(
  shiftId: number,
  organizationId: number,
  type: AttendanceType,
  excludeAttendanceId?: number
) {
  const attendance = await repo.findAttendanceByShiftAndType(
    shiftId,
    type,
    organizationId,
    excludeAttendanceId
  );

  if (attendance) {
    const code =
      type === "CLOCK_IN"
        ? "CLOCK_IN_ALREADY_EXISTS"
        : "CLOCK_OUT_ALREADY_EXISTS";
    throw httpError("Attendance already exists", 409, code);
  }
}

async function createAttendanceRecord(
  organizationId: number,
  data: CreateAttendanceDto
): Promise<CreateAttendanceResponse> {
  const shift = await resolveShift(data.shiftId, organizationId);

  await ensureUniqueAttendance(shift.id, organizationId, data.type);

  const attendance = await repo.createAttendance({
    shiftId: shift.id,
    userId: shift.userId,
    organizationId,
    type: data.type,
    latitude: 0,
    longitude: 0,
    distanceMeters: 0,
    occurredAt: data.occurredAt ?? new Date(),
  });

  return {
    attendance,
  };
}

export const createAttendance = async (
  organizationId: number,
  actorUserId: number,
  data: CreateAttendanceDto
): Promise<CreateAttendanceResponse> => {
  void actorUserId;
  return createAttendanceRecord(organizationId, data);
};

export const getAttendance = async (
  attendanceId: number,
  organizationId: number,
  actorUserId: number,
  actorRole: string
): Promise<GetAttendanceResponse | null> => {
  const attendance = await repo.findAttendanceById(attendanceId, organizationId);

  if (!attendance) {
    return null;
  }

  if (!isPrivilegedRole(actorRole) && attendance.userId !== actorUserId) {
    throw httpError("Attendance forbidden", 403, "ATTENDANCE_FORBIDDEN");
  }

  return {
    attendance,
  };
};

export const getAttendances = async (
  filters: GetAttendancesDto,
  organizationId: number,
  actorUserId: number,
  actorRole: string
): Promise<GetAttendancesResponse> => {
  if (filters.from && filters.to && filters.from >= filters.to) {
    throw httpError("Invalid date range", 400, "INVALID_DATE_RANGE");
  }

  const effectiveFilters: GetAttendancesDto = {
    ...filters,
  };

  if (!isPrivilegedRole(actorRole)) {
    if (filters.userId !== undefined && filters.userId !== actorUserId) {
      throw httpError("Attendance forbidden", 403, "ATTENDANCE_FORBIDDEN");
    }

    effectiveFilters.userId = actorUserId;
  }

  return repo.getAttendances(effectiveFilters, organizationId);
};

export const getAttendanceCalendar = async (
  data: GetAttendanceCalendarDto,
  organizationId: number,
  actorUserId: number,
  actorRole: string
): Promise<GetAttendanceCalendarResponse> => {
  const userId = isPrivilegedRole(actorRole)
    ? (data.userId ?? actorUserId)
    : actorUserId;

  if (!isPrivilegedRole(actorRole) && data.userId !== undefined && data.userId !== actorUserId) {
    throw httpError("Attendance forbidden", 403, "ATTENDANCE_FORBIDDEN");
  }

  const baseDate = data.date ?? new Date();
  const includeWeek = data.includeWeek ?? true;
  const includeMonth = data.includeMonth ?? true;

  const weekPromise = includeWeek
    ? repo.getAttendances(
        {
          userId,
          from: getStartOfWeek(baseDate),
          to: getEndOfWeek(getStartOfWeek(baseDate)),
          limit: 1000,
          offset: 0,
        },
        organizationId
      )
    : Promise.resolve({ attendances: [], total: 0 });

  const monthPromise = includeMonth
    ? repo.getAttendances(
        {
          userId,
          from: getStartOfMonth(baseDate),
          to: getEndOfMonth(baseDate),
          limit: 1000,
          offset: 0,
        },
        organizationId
      )
    : Promise.resolve({ attendances: [], total: 0 });

  const [week, month] = await Promise.all([weekPromise, monthPromise]);

  return {
    week: week.attendances,
    month: month.attendances,
  };
};

export const updateAttendance = async (
  attendanceId: number,
  organizationId: number,
  actorUserId: number,
  actorRole: string,
  data: UpdateAttendanceDto
): Promise<UpdateAttendanceResponse> => {
  const current = await repo.findAttendanceById(attendanceId, organizationId);

  if (!current) {
    throw httpError("Attendance not found", 404, "ATTENDANCE_NOT_FOUND");
  }

  if (!isPrivilegedRole(actorRole) && current.userId !== actorUserId) {
    throw httpError("Attendance forbidden", 403, "ATTENDANCE_FORBIDDEN");
  }

  const targetShiftId = data.shiftId ?? current.shiftId;
  const shift = await resolveShift(targetShiftId, organizationId);
  const targetType = data.type ?? current.type;

  await ensureUniqueAttendance(
    shift.id,
    organizationId,
    targetType,
    attendanceId
  );

  const updated = await repo.updateAttendanceById(attendanceId, {
    shiftId: shift.id,
    userId: shift.userId,
    organizationId,
    type: targetType,
    occurredAt: data.occurredAt,
  });

  return {
    attendance: updated,
  };
};

export const deleteAttendance = async (
  attendanceId: number,
  organizationId: number,
  actorUserId: number,
  actorRole: string
): Promise<DeleteAttendanceResponse> => {
  const current = await repo.findAttendanceById(attendanceId, organizationId);

  if (!current) {
    throw httpError("Attendance not found", 404, "ATTENDANCE_NOT_FOUND");
  }

  if (!isPrivilegedRole(actorRole) && current.userId !== actorUserId) {
    throw httpError("Attendance forbidden", 403, "ATTENDANCE_FORBIDDEN");
  }

  await repo.deleteAttendanceById(attendanceId);

  return {
    success: true,
  };
};

async function clockAttendance(
  kind: "CLOCK_IN" | "CLOCK_OUT",
  userId: number,
  organizationId: number,
  data: ClockInDto | ClockOutDto
): Promise<AttendanceClockResponse> {
  const shift = await resolveShift(data.shiftId, organizationId);

  if (shift.userId !== userId) {
    throw httpError("Attendance forbidden", 403, "ATTENDANCE_FORBIDDEN");
  }

  if (!shift.published) {
    throw httpError("Shift not published", 400, "SHIFT_NOT_PUBLISHED");
  }

  const now = new Date();
  const startsAt = new Date(shift.startsAt);
  const endsAt = new Date(shift.endsAt);
  const allowedFrom = new Date(startsAt.getTime() - 30 * 60 * 1000);

  if (kind === "CLOCK_IN") {
    if (now < allowedFrom) {
      throw httpError("Too early", 409, "CLOCK_IN_NOT_AVAILABLE");
    }

    if (now > endsAt) {
      await repo.updateShiftById(shift.id, {
        status: "MISSED",
      });
      throw httpError("Shift missed", 409, "SHIFT_MISSED");
    }
  }

  const distanceMeters = await ensureWithinOrganizationRadius(
    organizationId,
    data.latitude,
    data.longitude
  );

  if (kind === "CLOCK_IN") {
    await ensureUniqueAttendance(shift.id, organizationId, "CLOCK_IN");
  }

  if (kind === "CLOCK_OUT") {
    const clockIn = await repo.findAttendanceByShiftAndType(
      shift.id,
      "CLOCK_IN",
      organizationId
    );

    if (!clockIn) {
      throw httpError("Must clock in first", 400, "CLOCK_IN_REQUIRED");
    }

    await ensureUniqueAttendance(shift.id, organizationId, "CLOCK_OUT");
  }

  const attendance = await repo.createAttendance({
    shiftId: shift.id,
    userId: shift.userId,
    organizationId,
    type: kind,
    latitude: data.latitude,
    longitude: data.longitude,
    distanceMeters,
    occurredAt: now,
  });

  if (kind === "CLOCK_IN") {
    await repo.updateShiftById(shift.id, {
      status: "IN_PROGRESS",
      actualStartsAt: now,
    });
  } else {
    await repo.updateShiftById(shift.id, {
      status: "COMPLETED",
      actualEndsAt: now,
    });
  }

  return attendance;
}

export const clockIn = async (
  userId: number,
  organizationId: number,
  data: ClockInDto
): Promise<AttendanceClockResponse> => {
  return clockAttendance("CLOCK_IN", userId, organizationId, data);
};

export const clockOut = async (
  userId: number,
  organizationId: number,
  data: ClockOutDto
): Promise<AttendanceClockResponse> => {
  return clockAttendance("CLOCK_OUT", userId, organizationId, data);
};
