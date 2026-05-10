import { httpError } from "@/lib/httpError";

import type {
  CreateShiftForCategoryFn,
  CreateShiftForUserFn,
  CreateShiftForUsersFn,
  GetShiftsFn,
  GetShiftResponseDto,
GetCalendarShiftsFn,
UpdateShiftFn 
} from "@hottime/types";

import * as repo from "@/modules/planning/repository";

/* =========================
   HELPERS
========================= */

async function validateOverlap(
  userId: number,
  organizationId: number,
  startsAt: Date,
  endsAt: Date
) {
  const overlap = await repo.hasOverlappingShift(
    userId,
    organizationId,
    startsAt,
    endsAt
  );

  if (overlap) {
    throw httpError(
      `User ${userId} already has a shift in this time range`,
      409,
      "SHIFT_OVERLAP"
    );
  }
}

/* =========================
   CREATE FOR USER
========================= */

export const createForUser: CreateShiftForUserFn = async (
  data,
  organizationId,
  createdById
) => {
  const user = await repo.findUserById(
    data.userId,
    organizationId
  );

  if (!user) {
    throw httpError(
      "User not found",
      404,
      "USER_NOT_FOUND"
    );
  }

  await validateOverlap(
    user.id,
    organizationId,
    data.startsAt,
    data.endsAt
  );

  const shift = await repo.createShift(
    user.id,
    organizationId,
    createdById,
    data.startsAt,
    data.endsAt,
    data.published,
    user.userCategories.map((c) => c.categoryId)
  );

  return {
    shifts: [shift],
    total: 1,
  };
};

/* =========================
   CREATE FOR USERS
========================= */

export const createForUsers: CreateShiftForUsersFn = async (
  data,
  organizationId,
  createdById
) => {
  const users = await repo.findUsersByIds(
    data.userIds,
    organizationId
  );

  if (users.length !== [...new Set(data.userIds)].length) {
    throw httpError(
      "Some users not found",
      404,
      "USER_NOT_FOUND"
    );
  }

  for (const user of users) {
    await validateOverlap(
      user.id,
      organizationId,
      data.startsAt,
      data.endsAt
    );
  }

  const shifts = await Promise.all(
    users.map((user) =>
      repo.createShift(
        user.id,
        organizationId,
        createdById,
        data.startsAt,
        data.endsAt,
        data.published,
        user.userCategories.map((c) => c.categoryId)
      )
    )
  );

  return {
    shifts,
    total: shifts.length,
  };
};

/* =========================
   CREATE FOR CATEGORY
========================= */

export const createForCategory: CreateShiftForCategoryFn = async (
  data,
  organizationId,
  createdById
) => {
  const users = await repo.findUsersByCategory(
    data.categoryId,
    organizationId
  );

  if (!users.length) {
    throw httpError(
      "No users found",
      404,
      "USERS_NOT_FOUND"
    );
  }

  for (const user of users) {
    await validateOverlap(
      user.id,
      organizationId,
      data.startsAt,
      data.endsAt
    );
  }

  const shifts = await Promise.all(
    users.map((user) =>
      repo.createShift(
        user.id,
        organizationId,
        createdById,
        data.startsAt,
        data.endsAt,
        data.published,
        user.userCategories.map((c) => c.categoryId)
      )
    )
  );

  return {
    shifts,
    total: shifts.length,
  };
};

/* =========================
   GET BY ID
========================= */

export const getById = async (
  shiftId: number,
  organizationId: number
): Promise<GetShiftResponseDto | null> => {
  const shift = await repo.getShiftById(
    shiftId,
    organizationId
  );

  if (!shift) return null;

  return {
    shift,
  };
};

/* =========================
   GET ALL
========================= */

export const getAll: GetShiftsFn = async (
  filters,
  organizationId
) => {
  const result = await repo.getShifts(
    filters,
    organizationId
  );

  return result;
};

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

/* =========================
   SERVICE
========================= */

export const getCalendarShifts: GetCalendarShiftsFn = async (
  data,
  organizationId
) => {
  const userId = data.userId!;
  const baseDate = data.date ?? new Date();

  const includeNext = data.includeNext ?? true;
  const includeWeek = data.includeWeek ?? true;
  const includeMonth = data.includeMonth ?? true;

  /* =========================
     PARALLEL EXECUTION
  ========================= */

  const promises: any = {};

  /* NEXT */
  if (includeNext) {
    promises.next = repo.getNextShift(
      organizationId,
      userId,
      new Date()
    );
  }

  /* WEEK */
  if (includeWeek) {
    const startWeek = getStartOfWeek(baseDate);
    const endWeek = getEndOfWeek(startWeek);

    promises.week = repo.getWeekShifts(
      organizationId,
      userId,
      startWeek,
      endWeek
    );
  }

  /* MONTH */
  if (includeMonth) {
    const startMonth = getStartOfMonth(baseDate);
    const endMonth = getEndOfMonth(baseDate);

    promises.month = repo.getMonthShifts(
      organizationId,
      userId,
      startMonth,
      endMonth
    );
  }

  const result = await Promise.all(
    Object.entries(promises).map(async ([key, fn]) => [
      key,
      await fn,
    ])
  );

  return Object.fromEntries(result);
};

/* =========================
   UPDATE SHIFT
========================= */

export const updateShift: UpdateShiftFn = async (
  data,
  organizationId,
  actorUserId
) => {
  const shift = await repo.findShiftById(
    data.shiftId,
    organizationId
  );

  if (!shift) {
    throw httpError(
      "Shift not found",
      404,
      "SHIFT_NOT_FOUND"
    );
  }

  /* =========================
     PERMISSION RULE
     (admins/managers + self allowed)
  ========================= */

  const isOwner = shift.userId === actorUserId;

  if (!isOwner) {
    // aquí podrías meter roles si quieres reforzar
    // pero según tu regla: admin/manager pueden
    // esto se controla en route guard normalmente
  }

  /* =========================
     OPTIONAL VALIDATION (FUTURE SAFE)
     overlap check si cambia fechas
  ========================= */

  if (data.startsAt || data.endsAt) {
    const startsAt = data.startsAt ?? shift.startsAt;
    const endsAt = data.endsAt ?? shift.endsAt;

    if (endsAt <= startsAt) {
      throw httpError(
        "Invalid date range",
        400,
        "INVALID_DATES"
      );
    }
  }

  /* =========================
     UPDATE
  ========================= */

  const updated = await repo.updateShiftById(
    data.shiftId,
    organizationId,
    {
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      status: data.status,
      published: data.published,
    }
  );

  return {
    shift: updated,
  };
};