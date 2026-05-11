import { httpError } from "@/lib/httpError";
import type {
  AttendanceClockResponse,
  ClockInDto,
  ClockOutDto,
  CreateAttendanceDto,
  CreateAttendanceResponse,
  DeleteAttendanceResponse,
  AttendanceType,
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

async function resolveShift(shiftId: number, organizationId: number) {
  const shift = await repo.getShiftById(shiftId, organizationId);

  if (!shift) {
    throw httpError("Shift not found", 404, "SHIFT_NOT_FOUND");
  }

  return shift;
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
    throw httpError(
      "Attendance already exists for this shift and type",
      409,
      "ATTENDANCE_ALREADY_EXISTS"
    );
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

  const result = await repo.getAttendances(effectiveFilters, organizationId);

  return result;
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
      throw httpError("Too early", 403, "TOO_EARLY");
    }

    if (now > endsAt) {
      throw httpError("Shift ended", 403, "SHIFT_ENDED");
    }
  }

  await ensureUniqueAttendance(shift.id, organizationId, kind);

  if (kind === "CLOCK_OUT") {
    const clockIn = await repo.findAttendanceByShiftAndType(
      shift.id,
      "CLOCK_IN",
      organizationId
    );

    if (!clockIn) {
      throw httpError("Must clock in first", 400, "CLOCK_IN_REQUIRED");
    }

    if (now < clockIn.occurredAt) {
      throw httpError("Invalid attendance range", 400, "INVALID_ATTENDANCE_RANGE");
    }
  }

  const attendance = await repo.createAttendance({
    shiftId: shift.id,
    userId: shift.userId,
    organizationId,
    type: kind,
    latitude: 0,
    longitude: 0,
    distanceMeters: 0,
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
