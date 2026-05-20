import { httpError } from "@/lib/httpError";
import type {
  CreateShiftForCategoryFn,
  CreateShiftForUserFn,
  CreateShiftForUsersFn,
  DeleteShiftFn,
  GetShiftsFn,
  GetShiftResponseDto,
  GetCalendarShiftsFn,
  UpdateShiftFn 
} from "@hottime/types";
import * as repo from "@/modules/planning/repository";

// Valida que el usuario no tenga otro turno asignado que coincida en horario con el nuevo turno
async function validateOverlap(userId: number, organizationId: number, startsAt: Date, endsAt: Date) {
  const overlap = await repo.hasOverlappingShift(userId, organizationId, startsAt, endsAt);
  if (overlap) throw httpError(`User ${userId} already has a shift in this time range`, 409, "SHIFT_OVERLAP");
}
// Obtiene la fecha y hora del inicio de la semana de una fecha dada
function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}
// Obtiene la fecha y hora del final de la semana a partir de una fecha inicial
function getEndOfWeek(start: Date) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}
// Obtiene el primer día del mes de una fecha dada
function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
// Obtiene el último día del mes de una fecha dada incluyendo la última hora del día
function getEndOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

//#region Create
// Create shift for user
export const createForUser: CreateShiftForUserFn = async (data, organizationId, createdById) => {
  const user = await repo.findUserById(data.userId, organizationId);
  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");
  await validateOverlap(user.id, organizationId, data.startsAt, data.endsAt);
  const shift = await repo.createShift(user.id, organizationId, createdById, data.startsAt, data.endsAt, data.published, user.userCategories.map((c) => c.categoryId));
  return { shifts: [shift],
    total: 1,
  };
};
// Create shift for users
export const createForUsers: CreateShiftForUsersFn = async (data, organizationId, createdById) => {
  const users = await repo.findUsersByIds(data.userIds, organizationId);
  if (users.length !== [...new Set(data.userIds)].length) throw httpError("Some users not found", 404, "USER_NOT_FOUND");
  for (const user of users) {
    await validateOverlap(user.id, organizationId, data.startsAt, data.endsAt);
  }
  const shifts = await Promise.all(
    users.map((user) =>
      repo.createShift(user.id, organizationId, createdById, data.startsAt, data.endsAt, data.published, user.userCategories.map((c) => c.categoryId))
    )
  );
  return {
    shifts,
    total: shifts.length,
  };
};
// Create shift for category
export const createForCategory: CreateShiftForCategoryFn = async (data, organizationId, createdById) => {
  const users = await repo.findUsersByCategory(data.categoryId, organizationId);
  if (!users.length) throw httpError("No users found", 404, "USERS_NOT_FOUND");
  for (const user of users) {
    await validateOverlap(user.id, organizationId, data.startsAt, data.endsAt);
  }
  const shifts = await Promise.all(
    users.map((user) =>
      repo.createShift(user.id, organizationId, createdById, data.startsAt, data.endsAt, data.published, user.userCategories.map((c) => c.categoryId))
    )
  );
  return {
    shifts,
    total: shifts.length,
  };
};
//#endregion

//#region Get
// Get shift by id
export const getById = async (shiftId: number, organizationId: number): Promise<GetShiftResponseDto | null> => {
  const shift = await repo.findShiftById(shiftId, organizationId);
  if (!shift) return null;
  return {
    shift,
  };
};
// Get all shifts list
export const getAll: GetShiftsFn = async (filters, organizationId) => {
  const result = await repo.getShifts(filters, organizationId);
  return result;
};
// Get shifts (calendar)
export const getCalendarShifts: GetCalendarShiftsFn = async (data, organizationId) => {
  const userId = data.userId!;
  const baseDate = data.date ?? new Date();
  const now = new Date();
  const includeNext = data.includeNext ?? true;
  const includeWeek = data.includeWeek ?? true;
  const includeMonth = data.includeMonth ?? true;
  await repo.syncOverdueShiftStatuses(organizationId, userId, now);
  const promises: any = {};
  if (includeNext) {
    promises.next = repo.getNextShift(organizationId, userId, now);
  }
  if (includeWeek) {
    const startWeek = getStartOfWeek(baseDate);
    const endWeek = getEndOfWeek(startWeek);
    promises.week = repo.getWeekShifts(organizationId, userId, startWeek, endWeek);
  }
  if (includeMonth) {
    const startMonth = getStartOfMonth(baseDate);
    const endMonth = getEndOfMonth(baseDate);
    promises.month = repo.getMonthShifts(organizationId, userId, startMonth, endMonth);
  }
  const result = await Promise.all(
    Object.entries(promises).map(async ([key, fn]) => [key, await fn])
  );
  return Object.fromEntries(result);
};
//#endregion

//#region Update
// Update shift
export const updateShift: UpdateShiftFn = async (data, organizationId, actorUserId) => {
  const shift = await repo.findShiftById(data.shiftId, organizationId);
  if (!shift) throw httpError("Shift not found", 404, "SHIFT_NOT_FOUND");
  if (data.startsAt || data.endsAt) {
    const startsAt = data.startsAt ?? shift.startsAt;
    const endsAt = data.endsAt ?? shift.endsAt;
    if (endsAt <= startsAt) throw httpError("Invalid date range", 400, "INVALID_DATES");
  }
  const updated = await repo.updateShiftById(data.shiftId, organizationId, {startsAt: data.startsAt, endsAt: data.endsAt, status: data.status, published: data.published});
  return {
    shift: updated,
  };
};
//#endregion

//#region Delete
// Delete shift
export const deleteShift: DeleteShiftFn = async (shiftId, organizationId, actorUserId) => {
  const shift = await repo.findShiftById(shiftId, organizationId);
  if (!shift) throw httpError("Shift not found", 404, "SHIFT_NOT_FOUND");
  await repo.deleteShiftById(shiftId, organizationId);
  return {
    success: true,
  };
};
//#endregion
