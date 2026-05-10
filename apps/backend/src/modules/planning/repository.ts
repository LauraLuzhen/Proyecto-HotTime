import { PrismaClient } from "@prisma/client";
import { httpError } from "@/lib/httpError";
import type { GetShiftsDto } from "@hottime/types";

const prisma = new PrismaClient();

/* =========================
   HELPERS
========================= */

function mapShiftCategories(
  shift: {
    shiftCategories: {
      categoryId: number;
      shiftId: number;
    }[];
  } & any
) {
  const { shiftCategories, ...rest } = shift;

  return {
    ...rest,
    categories: shiftCategories,
  };
}

/* =========================
   USERS
========================= */

export function findUserById(
  userId: number,
  organizationId: number
) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      organizationId,
    },
    select: {
      id: true,
      userCategories: {
        select: {
          categoryId: true,
        },
      },
    },
  });
}

export function findUsersByIds(
  userIds: number[],
  organizationId: number
) {
  return prisma.user.findMany({
    where: {
      id: {
        in: [...new Set(userIds)],
      },
      organizationId,
    },
    select: {
      id: true,
      userCategories: {
        select: {
          categoryId: true,
        },
      },
    },
  });
}

export function findUsersByCategory(
  categoryId: number | null,
  organizationId: number
) {
  return prisma.user.findMany({
    where: {
      organizationId,
      ...(categoryId === null
        ? {
            userCategories: {
              none: {},
            },
          }
        : {
            userCategories: {
              some: {
                categoryId,
              },
            },
          }),
    },
    select: {
      id: true,
      userCategories: {
        select: {
          categoryId: true,
        },
      },
    },
  });
}

/* =========================
   OVERLAPS
========================= */

export async function hasOverlappingShift(
  userId: number,
  organizationId: number,
  startsAt: Date,
  endsAt: Date
) {
  const shift = await prisma.shift.findFirst({
    where: {
      userId,
      organizationId,
      startsAt: {
        lt: endsAt,
      },
      endsAt: {
        gt: startsAt,
      },
    },
    select: {
      id: true,
    },
  });

  return !!shift;
}

/* =========================
   CREATE
========================= */

export async function createShift(
  userId: number,
  organizationId: number,
  createdById: number,
  startsAt: Date,
  endsAt: Date,
  published = false,
  categoryIds: number[] = []
) {
  const shift = await prisma.shift.create({
    data: {
      userId,
      organizationId,
      createdById,
      startsAt,
      endsAt,
      published,
      shiftCategories: {
        create: categoryIds.map((categoryId) => ({
          categoryId,
        })),
      },
    },
    include: {
      shiftCategories: {
        select: {
          shiftId: true,
          categoryId: true,
        },
      },
    },
  });

  return mapShiftCategories(shift);
}

/* =========================
   GET BY ID
========================= */

export async function getShiftById(
  shiftId: number,
  organizationId: number
) {
  const shift = await prisma.shift.findFirst({
    where: {
      id: shiftId,
      organizationId,
    },
    include: {
      shiftCategories: {
        select: {
          shiftId: true,
          categoryId: true,
        },
      },
    },
  });

  if (!shift) return null;

  return mapShiftCategories(shift);
}

/* =========================
   GET ALL WITH FILTERS
========================= */

export async function getShifts(
  filters: GetShiftsDto,
  organizationId: number
) {
  const {
    shiftId,
    userId,
    userIds,
    categoryId,
    published,
    status,
    startsFrom,
    startsTo,
    endsFrom,
    endsTo,
    limit = 50,
    offset = 0,
  } = filters;

  const where: any = {
    organizationId,

    ...(shiftId && { id: shiftId }),

    ...(userId && { userId }),

    ...(userIds?.length && {
      userId: { in: userIds },
    }),

    ...(published !== undefined && {
      published,
    }),

    ...(status && { status }),

    ...(startsFrom || startsTo
      ? {
          startsAt: {
            ...(startsFrom && { gte: startsFrom }),
            ...(startsTo && { lte: startsTo }),
          },
        }
      : {}),

    ...(endsFrom || endsTo
      ? {
          endsAt: {
            ...(endsFrom && { gte: endsFrom }),
            ...(endsTo && { lte: endsTo }),
          },
        }
      : {}),

    ...(categoryId && {
      shiftCategories: {
        some: {
          categoryId,
        },
      },
    }),
  };

  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({
      where,
      include: {
        shiftCategories: {
          select: {
            shiftId: true,
            categoryId: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
      take: limit,
      skip: offset,
    }),

    prisma.shift.count({ where }),
  ]);

  return {
    shifts: shifts.map(mapShiftCategories),
    total,
  };
}

/* =========================
   NEXT SHIFT
========================= */

export async function getNextShift(
  organizationId: number,
  userId: number,
  now: Date
) {
  const shift = await prisma.shift.findFirst({
    where: {
      organizationId,
      userId,
      startsAt: { gte: now },
    },
    orderBy: {
      startsAt: "asc",
    },
    include: {
      shiftCategories: {
        select: {
          shiftId: true,
          categoryId: true,
        },
      },
    },
  });

  return shift ? mapShiftCategories(shift) : null;
}

/* =========================
   WEEK SHIFTS
========================= */

export async function getWeekShifts(
  organizationId: number,
  userId: number,
  start: Date,
  end: Date
) {
  const shifts = await prisma.shift.findMany({
    where: {
      organizationId,
      userId,
      startsAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      startsAt: "asc",
    },
    include: {
      shiftCategories: {
        select: {
          shiftId: true,
          categoryId: true,
        },
      },
    },
  });

  return shifts.map(mapShiftCategories);
}

/* =========================
   MONTH SHIFTS
========================= */

export async function getMonthShifts(
  organizationId: number,
  userId: number,
  start: Date,
  end: Date
) {
  const shifts = await prisma.shift.findMany({
    where: {
      organizationId,
      userId,
      startsAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      startsAt: "asc",
    },
    include: {
      shiftCategories: {
        select: {
          shiftId: true,
          categoryId: true,
        },
      },
    },
  });

  return shifts.map(mapShiftCategories);
}