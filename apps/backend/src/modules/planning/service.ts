import type {
  AttendanceQueryDto,
  ClockDto,
  ClockInFn,
  ClockOutFn,
  CreateManyShiftsFn,
  CreateShiftFn,
  DeleteShiftFn,
  GetAttendanceFn,
  GetMonthAttendanceFn,
  GetMonthShiftsFn,
  GetNextShiftFn,
  GetShiftByIdFn,
  GetShiftsFn,
  GetWeekAttendanceFn,
  GetWeekShiftsFn,
  PlanningRangeQueryDto,
  PlanningUserQueryDto,
  Role,
  UpdateShiftFn,
} from "@hottime/types";
import { httpError } from "@/lib/httpError";
import * as repo from "@/modules/planning/repository";
import type { CreateManyShiftsInput, CreateShiftInput, UpdateShiftInput } from "./schemas";

function isPlanner(role: Role) {
  return role === "ADMIN" || role === "MANAGER";
}

function assertPlanner(role: Role) {
  if (!isPlanner(role)) throw httpError("Only admin or manager can manage shifts", 403, "PLANNING_FORBIDDEN");
}

function assertValidRange(startsAt: Date, endsAt: Date) {
  if (startsAt >= endsAt) throw httpError("Shift start must be before shift end", 400, "INVALID_SHIFT_RANGE");
}

function assertValidActualRange(actualStartsAt?: Date | null, actualEndsAt?: Date | null) {
  if (actualStartsAt && actualEndsAt && actualStartsAt > actualEndsAt) {
    throw httpError("Actual start must be before actual end", 400, "INVALID_ACTUAL_RANGE");
  }
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - day + 1);
  return result;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function minutesBefore(date: Date, minutes: number) {
  return new Date(date.getTime() - minutes * 60 * 1000);
}

function distanceMeters(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => value * Math.PI / 180;
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const latitude1 = toRadians(from.latitude);
  const latitude2 = toRadians(to.latitude);
  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function ensureUserInOrganization(userId: number, organizationId: number) {
  const user = await repo.findUserById(userId);
  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");
  if (user.organizationId !== organizationId) throw httpError("User does not belong to your organization", 403, "USER_FORBIDDEN");
  return user;
}

async function ensureUsersInOrganization(userIds: number[], organizationId: number) {
  const uniqueIds = [...new Set(userIds)];
  const users = await repo.findUsersByIds(uniqueIds, organizationId);
  if (users.length !== uniqueIds.length) {
    throw httpError("One or more users do not belong to your organization", 403, "USER_FORBIDDEN");
  }
  return uniqueIds;
}

async function ensureCategoryInOrganization(categoryId: number | null | undefined, organizationId: number) {
  if (categoryId === null || categoryId === undefined) return;
  const category = await repo.findCategoryById(categoryId);
  if (!category) throw httpError("Category not found", 404, "CATEGORY_NOT_FOUND");
  if (category.organizationId !== organizationId) throw httpError("Category does not belong to your organization", 403, "CATEGORY_FORBIDDEN");
}

async function assertNoOverlap(userId: number, organizationId: number, startsAt: Date, endsAt: Date, excludeShiftId?: number) {
  const overlapping = await repo.findOverlappingShift(userId, organizationId, startsAt, endsAt, excludeShiftId);
  if (overlapping) {
    throw httpError("Shift overlaps another shift for this user", 409, "SHIFT_OVERLAP");
  }
}

async function ensureAttendanceLocation(organizationId: number, latitude: number, longitude: number) {
  const organization = await repo.findOrganizationById(organizationId);
  if (!organization) throw httpError("Organization not found", 404, "ORGANIZATION_NOT_FOUND");
  if (
    organization.latitude === null
    || organization.longitude === null
    || organization.allowedRadiusMeters === null
  ) {
    throw httpError("Organization clock location is not configured", 400, "ORGANIZATION_LOCATION_NOT_CONFIGURED");
  }

  const distance = distanceMeters(
    { latitude, longitude },
    { latitude: organization.latitude, longitude: organization.longitude }
  );

  if (distance > organization.allowedRadiusMeters) {
    throw httpError("You are outside the allowed clock-in area", 403, "ATTENDANCE_LOCATION_OUT_OF_RANGE");
  }

  return distance;
}

function resolveVisibleUserId(filters: PlanningUserQueryDto, actorId: number, actorRole: Role) {
  if (!isPlanner(actorRole)) {
    if (filters.userId && filters.userId !== actorId) throw httpError("You can only view your own planning", 403, "PLANNING_FORBIDDEN");
    return actorId;
  }
  return filters.userId ?? actorId;
}

async function resolveRangeFilters(filters: PlanningRangeQueryDto, actorId: number, actorRole: Role, organizationId: number) {
  if (!isPlanner(actorRole)) {
    if (filters.userId && filters.userId !== actorId) throw httpError("You can only view your own planning", 403, "PLANNING_FORBIDDEN");
    if (filters.userIds?.some((userId) => userId !== actorId)) throw httpError("You can only view your own planning", 403, "PLANNING_FORBIDDEN");
    return { ...filters, userId: actorId };
  }

  if (filters.userId && filters.userIds?.length) throw httpError("Use userId or userIds, not both", 400, "INVALID_USER_FILTERS");
  if (filters.userId) await ensureUserInOrganization(filters.userId, organizationId);
  if (filters.userIds?.length) await ensureUsersInOrganization(filters.userIds, organizationId);
  await ensureCategoryInOrganization(filters.categoryId, organizationId);
  if (filters.from && filters.to && filters.from >= filters.to) throw httpError("Range start must be before range end", 400, "INVALID_DATE_RANGE");
  return filters;
}

// Create shift by ADMIN/MANAGER
export const createShift: CreateShiftFn = async (data: CreateShiftInput, actorId, organizationId) => {
  assertValidRange(data.startsAt, data.endsAt);
  await ensureUserInOrganization(actorId, organizationId);
  await ensureUserInOrganization(data.userId, organizationId);
  await ensureCategoryInOrganization(data.categoryId, organizationId);
  await assertNoOverlap(data.userId, organizationId, data.startsAt, data.endsAt);

  return repo.createShift({ ...data, organizationId, createdById: actorId });
};

// Create many shifts by ADMIN/MANAGER
export const createManyShifts: CreateManyShiftsFn = async (data: CreateManyShiftsInput, actorId, organizationId) => {
  assertValidRange(data.startsAt, data.endsAt);
  await ensureUserInOrganization(actorId, organizationId);
  await ensureCategoryInOrganization(data.categoryId, organizationId);
  if (data.allUsers && data.userIds?.length) throw httpError("Use userIds or allUsers, not both", 400, "INVALID_USER_SELECTION");
  const userIds = data.allUsers
    ? (await repo.findAllUserIdsByOrganization(organizationId)).map((user) => user.id)
    : await ensureUsersInOrganization(data.userIds ?? [], organizationId);

  if (!userIds.length) throw httpError("Select at least one user", 400, "NO_USERS_SELECTED");

  for (const userId of userIds) {
    await assertNoOverlap(userId, organizationId, data.startsAt, data.endsAt);
  }

  return repo.createManyShifts(userIds.map((userId) => ({
    userId,
    categoryId: data.categoryId,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    published: data.published,
    organizationId,
    createdById: actorId,
  })));
};

// Get shifts visible to current user
export const getShifts: GetShiftsFn = async (filters, actorId, actorRole, organizationId) => {
  const safeFilters = await resolveRangeFilters(filters, actorId, actorRole, organizationId);
  return repo.findShifts(organizationId, safeFilters);
};

// Get shift by id
export const getShiftById: GetShiftByIdFn = async (shiftId, actorId, actorRole, organizationId) => {
  const shift = await repo.findShiftById(shiftId, organizationId);
  if (!shift) throw httpError("Shift not found", 404, "SHIFT_NOT_FOUND");
  if (!isPlanner(actorRole) && shift.userId !== actorId) throw httpError("You can only view your own planning", 403, "PLANNING_FORBIDDEN");
  return shift;
};

// Get next shift
export const getNextShift: GetNextShiftFn = async (filters, actorId, actorRole, organizationId) => {
  const userId = resolveVisibleUserId(filters, actorId, actorRole);
  if (isPlanner(actorRole)) await ensureUserInOrganization(userId, organizationId);
  return repo.findNextShift(organizationId, userId, new Date());
};

// Get weekly shifts
export const getWeekShifts: GetWeekShiftsFn = async (filters, actorId, actorRole, organizationId, now = new Date()) => {
  const from = startOfWeek(now);
  const to = addDays(from, 7);
  const userId = resolveVisibleUserId(filters, actorId, actorRole);
  if (isPlanner(actorRole)) await ensureUserInOrganization(userId, organizationId);
  return repo.findShifts(organizationId, { from, to, userId });
};

// Get monthly shifts
export const getMonthShifts: GetMonthShiftsFn = async (filters, actorId, actorRole, organizationId, now = new Date()) => {
  const from = startOfMonth(now);
  const to = addMonths(from, 1);
  const userId = resolveVisibleUserId(filters, actorId, actorRole);
  if (isPlanner(actorRole)) await ensureUserInOrganization(userId, organizationId);
  return repo.findShifts(organizationId, { from, to, userId });
};

// Update shift by ADMIN/MANAGER
export const updateShift: UpdateShiftFn = async (shiftId, data: UpdateShiftInput, actorId, organizationId) => {
  await ensureUserInOrganization(actorId, organizationId);
  const shift = await repo.findShiftById(shiftId, organizationId);
  if (!shift) throw httpError("Shift not found", 404, "SHIFT_NOT_FOUND");

  const userId = data.userId ?? shift.userId;
  const startsAt = data.startsAt ?? shift.startsAt;
  const endsAt = data.endsAt ?? shift.endsAt;
  const actualStartsAt = data.actualStartsAt === undefined ? shift.actualStartsAt : data.actualStartsAt;
  const actualEndsAt = data.actualEndsAt === undefined ? shift.actualEndsAt : data.actualEndsAt;

  assertValidRange(startsAt, endsAt);
  assertValidActualRange(actualStartsAt, actualEndsAt);
  if (data.userId) await ensureUserInOrganization(data.userId, organizationId);
  if (data.categoryId !== undefined) await ensureCategoryInOrganization(data.categoryId, organizationId);

  if (shift.attendances.length && data.userId && data.userId !== shift.userId) {
    throw httpError("Cannot change the user of a shift with attendance records", 409, "SHIFT_HAS_ATTENDANCE");
  }

  if (data.status === "COMPLETED" && !actualStartsAt && !shift.attendances.some((attendance) => attendance.type === "CLOCK_IN")) {
    throw httpError("Cannot complete a shift without a clock-in", 400, "CLOCK_IN_REQUIRED");
  }

  await assertNoOverlap(userId, organizationId, startsAt, endsAt, shiftId);
  return repo.updateShiftById(shiftId, organizationId, data);
};

// Delete shift by ADMIN/MANAGER
export const deleteShift: DeleteShiftFn = async (shiftId, actorId, organizationId) => {
  await ensureUserInOrganization(actorId, organizationId);
  const shift = await repo.findShiftById(shiftId, organizationId);
  if (!shift) throw httpError("Shift not found", 404, "SHIFT_NOT_FOUND");

  if (shift.attendances.length) {
    throw httpError("Cannot delete a shift with attendance records. Cancel it instead.", 409, "SHIFT_HAS_ATTENDANCE");
  }

  await repo.deleteShift(shiftId, organizationId);
  return { success: true };
};

// Clock in current user
export const clockIn: ClockInFn = async (data: ClockDto, actorId, organizationId) => {
  const occurredAt = data.occurredAt ?? new Date();
  const shift = await repo.findShiftBasicById(data.shiftId, organizationId);
  if (!shift) throw httpError("Shift not found", 404, "SHIFT_NOT_FOUND");
  if (shift.userId !== actorId) throw httpError("You can only clock your own shift", 403, "ATTENDANCE_FORBIDDEN");
  if (!shift.published) throw httpError("Cannot clock an unpublished shift", 400, "SHIFT_NOT_PUBLISHED");
  if (["CANCELLED", "MISSED", "COMPLETED"].includes(shift.status)) throw httpError("Shift is not open for clock-in", 409, "SHIFT_NOT_CLOCKABLE");
  if (occurredAt < minutesBefore(shift.startsAt, 60) || occurredAt > shift.endsAt) throw httpError("Clock-in is only available near the shift start", 409, "CLOCK_IN_NOT_AVAILABLE");
  if (shift.attendances.some((attendance) => attendance.type === "CLOCK_IN")) throw httpError("Shift already has a clock-in", 409, "CLOCK_IN_ALREADY_EXISTS");
  if (shift.attendances.some((attendance) => attendance.type === "CLOCK_OUT")) throw httpError("Shift already has a clock-out", 409, "CLOCK_OUT_ALREADY_EXISTS");
  const distance = await ensureAttendanceLocation(organizationId, data.latitude, data.longitude);

  return repo.createAttendanceAndUpdateShift(data.shiftId, actorId, organizationId, "CLOCK_IN", occurredAt, data.latitude, data.longitude, distance, {
    status: "IN_PROGRESS",
    actualStartsAt: occurredAt,
  });
};

// Clock out current user
export const clockOut: ClockOutFn = async (data: ClockDto, actorId, organizationId) => {
  const occurredAt = data.occurredAt ?? new Date();
  const shift = await repo.findShiftBasicById(data.shiftId, organizationId);
  if (!shift) throw httpError("Shift not found", 404, "SHIFT_NOT_FOUND");
  if (shift.userId !== actorId) throw httpError("You can only clock your own shift", 403, "ATTENDANCE_FORBIDDEN");
  if (["CANCELLED", "MISSED"].includes(shift.status)) throw httpError("Shift is not open for clock-out", 409, "SHIFT_NOT_CLOCKABLE");

  const clockInAttendance = shift.attendances.find((attendance) => attendance.type === "CLOCK_IN");
  if (!clockInAttendance) throw httpError("Clock-in is required before clock-out", 400, "CLOCK_IN_REQUIRED");
  if (shift.attendances.some((attendance) => attendance.type === "CLOCK_OUT")) throw httpError("Shift already has a clock-out", 409, "CLOCK_OUT_ALREADY_EXISTS");
  if (occurredAt < clockInAttendance.occurredAt) throw httpError("Clock-out cannot be before clock-in", 400, "INVALID_ATTENDANCE_RANGE");
  const distance = await ensureAttendanceLocation(organizationId, data.latitude, data.longitude);

  return repo.createAttendanceAndUpdateShift(data.shiftId, actorId, organizationId, "CLOCK_OUT", occurredAt, data.latitude, data.longitude, distance, {
    status: "COMPLETED",
    actualEndsAt: occurredAt,
  });
};

// Get attendance visible to current user
export const getAttendance: GetAttendanceFn = async (filters: AttendanceQueryDto, actorId, actorRole, organizationId) => {
  const safeFilters = { ...filters };
  if (!isPlanner(actorRole)) {
    if (filters.userId && filters.userId !== actorId) throw httpError("You can only view your own attendance", 403, "ATTENDANCE_FORBIDDEN");
    if (filters.userIds?.some((userId) => userId !== actorId)) throw httpError("You can only view your own attendance", 403, "ATTENDANCE_FORBIDDEN");
    safeFilters.userId = actorId;
    safeFilters.userIds = undefined;
  } else if (filters.userId) {
    if (filters.userIds?.length) throw httpError("Use userId or userIds, not both", 400, "INVALID_USER_FILTERS");
    await ensureUserInOrganization(filters.userId, organizationId);
  } else if (filters.userIds?.length) {
    await ensureUsersInOrganization(filters.userIds, organizationId);
  }

  if (filters.shiftId) {
    const shift = await repo.findShiftBasicById(filters.shiftId, organizationId);
    if (!shift) throw httpError("Shift not found", 404, "SHIFT_NOT_FOUND");
    if (!isPlanner(actorRole) && shift.userId !== actorId) throw httpError("You can only view your own attendance", 403, "ATTENDANCE_FORBIDDEN");
  }

  if (filters.from && filters.to && filters.from >= filters.to) throw httpError("Range start must be before range end", 400, "INVALID_DATE_RANGE");
  return repo.findAttendance(organizationId, safeFilters);
};

// Get weekly attendance
export const getWeekAttendance: GetWeekAttendanceFn = async (filters, actorId, actorRole, organizationId, now = new Date()) => {
  const from = startOfWeek(now);
  const to = addDays(from, 7);
  const userId = resolveVisibleUserId(filters, actorId, actorRole);
  if (isPlanner(actorRole)) await ensureUserInOrganization(userId, organizationId);
  return repo.findAttendance(organizationId, { from, to, userId });
};

// Get monthly attendance
export const getMonthAttendance: GetMonthAttendanceFn = async (filters, actorId, actorRole, organizationId, now = new Date()) => {
  const from = startOfMonth(now);
  const to = addMonths(from, 1);
  const userId = resolveVisibleUserId(filters, actorId, actorRole);
  if (isPlanner(actorRole)) await ensureUserInOrganization(userId, organizationId);
  return repo.findAttendance(organizationId, { from, to, userId });
};
