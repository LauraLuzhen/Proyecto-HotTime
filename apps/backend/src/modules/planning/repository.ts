import { PrismaClient } from "@prisma/client";
import { httpError } from "@/lib/httpError";

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
