import { httpError } from "@/lib/httpError";

import type {
  CreateShiftForCategoryFn,
  CreateShiftForUserFn,
  CreateShiftForUsersFn,
  GetShiftsFn,
  GetShiftResponseDto,
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