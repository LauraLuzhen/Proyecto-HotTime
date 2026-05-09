import { PrismaClient, type Prisma, type AttendanceType, type ShiftStatus } from "@prisma/client";
import type { AttendanceQueryDto, CreateShiftDto, PlanningRangeQueryDto, UpdateShiftDto } from "@hottime/types";

const prisma = new PrismaClient();

const planningUserSelect = {
  id: true,
  fullName: true,
  email: true,
} satisfies Prisma.UserSelect;

const attendanceSelect = {
  id: true,
  organizationId: true,
  shiftId: true,
  userId: true,
  type: true,
  latitude: true,
  longitude: true,
  distanceMeters: true,
  occurredAt: true,
  createdAt: true,
} satisfies Prisma.AttendanceSelect;

const shiftSelect = {
  id: true,
  organizationId: true,
  userId: true,
  createdById: true,
  categoryId: true,
  startsAt: true,
  endsAt: true,
  actualStartsAt: true,
  actualEndsAt: true,
  status: true,
  published: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: planningUserSelect,
  },
  createdBy: {
    select: planningUserSelect,
  },
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  attendances: {
    select: attendanceSelect,
    orderBy: {
      occurredAt: "asc",
    },
  },
} satisfies Prisma.ShiftSelect;

function uniqueIds(ids: number[]) {
  return [...new Set(ids)];
}

function buildShiftWhere(organizationId: number, filters: PlanningRangeQueryDto): Prisma.ShiftWhereInput {
  return {
    organizationId,
    userId: filters.userId ?? (filters.userIds?.length ? { in: uniqueIds(filters.userIds) } : undefined),
    categoryId: filters.categoryId,
    status: filters.status,
    published: filters.published,
    startsAt: filters.to ? { lt: filters.to } : undefined,
    endsAt: filters.from ? { gt: filters.from } : undefined,
  };
}

function buildAttendanceWhere(organizationId: number, filters: AttendanceQueryDto): Prisma.AttendanceWhereInput {
  return {
    organizationId,
    userId: filters.userId ?? (filters.userIds?.length ? { in: uniqueIds(filters.userIds) } : undefined),
    shiftId: filters.shiftId,
    type: filters.type,
    occurredAt: {
      gte: filters.from,
      lt: filters.to,
    },
  };
}

//#region READ
export function findUserById(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      organizationId: true,
    },
  });
}

export function findUsersByIds(userIds: number[], organizationId: number) {
  return prisma.user.findMany({
    where: {
      id: { in: uniqueIds(userIds) },
      organizationId,
    },
    select: {
      id: true,
      organizationId: true,
    },
  });
}

export function findAllUserIdsByOrganization(organizationId: number) {
  return prisma.user.findMany({
    where: { organizationId },
    select: { id: true },
  });
}

export function findCategoryById(categoryId: number) {
  return prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      organizationId: true,
    },
  });
}

export function findOrganizationById(organizationId: number) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      allowedRadiusMeters: true,
    },
  });
}

export function findShiftById(shiftId: number, organizationId: number) {
  return prisma.shift.findFirst({
    where: {
      id: shiftId,
      organizationId,
    },
    select: shiftSelect,
  });
}

export function findShiftBasicById(shiftId: number, organizationId: number) {
  return prisma.shift.findFirst({
    where: {
      id: shiftId,
      organizationId,
    },
    select: {
      id: true,
      organizationId: true,
      userId: true,
      startsAt: true,
      endsAt: true,
      actualStartsAt: true,
      actualEndsAt: true,
      status: true,
      published: true,
      attendances: {
        select: attendanceSelect,
        orderBy: {
          occurredAt: "asc",
        },
      },
    },
  });
}

export function findShifts(organizationId: number, filters: PlanningRangeQueryDto) {
  return prisma.shift.findMany({
    where: buildShiftWhere(organizationId, filters),
    orderBy: [
      { startsAt: "asc" },
      { user: { fullName: "asc" } },
    ],
    select: shiftSelect,
  });
}

export function findNextShift(organizationId: number, userId: number, now: Date) {
  return prisma.shift.findFirst({
    where: {
      organizationId,
      userId,
      published: true,
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      endsAt: { gt: now },
    },
    orderBy: {
      startsAt: "asc",
    },
    select: shiftSelect,
  });
}

export function findOverlappingShift(userId: number, organizationId: number, startsAt: Date, endsAt: Date, excludeShiftId?: number) {
  return prisma.shift.findFirst({
    where: {
      organizationId,
      userId,
      id: excludeShiftId ? { not: excludeShiftId } : undefined,
      status: { not: "CANCELLED" },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
    },
  });
}

export function findAttendance(organizationId: number, filters: AttendanceQueryDto) {
  return prisma.attendance.findMany({
    where: buildAttendanceWhere(organizationId, filters),
    orderBy: {
      occurredAt: "asc",
    },
    select: attendanceSelect,
  });
}

export function countAttendanceByShift(shiftId: number, organizationId: number) {
  return prisma.attendance.count({
    where: {
      shiftId,
      organizationId,
    },
  });
}
//#endregion

//#region WRITE
export function createShift(data: CreateShiftDto & { organizationId: number; createdById: number }) {
  return prisma.shift.create({
    data: {
      organizationId: data.organizationId,
      userId: data.userId,
      createdById: data.createdById,
      categoryId: data.categoryId ?? null,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      published: data.published ?? false,
    },
    select: shiftSelect,
  });
}

export function createManyShifts(shifts: (CreateShiftDto & { organizationId: number; createdById: number })[]) {
  return prisma.$transaction(
    shifts.map((shift) => prisma.shift.create({
      data: {
        organizationId: shift.organizationId,
        userId: shift.userId,
        createdById: shift.createdById,
        categoryId: shift.categoryId ?? null,
        startsAt: shift.startsAt,
        endsAt: shift.endsAt,
        published: shift.published ?? false,
      },
      select: shiftSelect,
    }))
  );
}

export function updateShiftById(shiftId: number, organizationId: number, data: UpdateShiftDto) {
  return prisma.shift.update({
    where: { id: shiftId, organizationId },
    data,
    select: shiftSelect,
  });
}

export function deleteShift(shiftId: number, organizationId: number) {
  return prisma.shift.delete({
    where: {
      id: shiftId,
      organizationId,
    },
  });
}

export async function createAttendanceAndUpdateShift(
  shiftId: number,
  userId: number,
  organizationId: number,
  type: AttendanceType,
  occurredAt: Date,
  latitude: number,
  longitude: number,
  distanceMeters: number,
  shiftData: { status: ShiftStatus; actualStartsAt?: Date; actualEndsAt?: Date }
) {
  return prisma.$transaction(async (tx) => {
    const attendance = await tx.attendance.create({
      data: {
        shiftId,
        userId,
        organizationId,
        type,
        latitude,
        longitude,
        distanceMeters,
        occurredAt,
      },
      select: attendanceSelect,
    });

    await tx.shift.update({
      where: { id: shiftId, organizationId },
      data: shiftData,
    });

    return attendance;
  });
}
//#endregion
