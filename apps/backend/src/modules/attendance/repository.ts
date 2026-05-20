import { PrismaClient } from "@prisma/client";
import type { AttendanceType } from "@hottime/types";
import type { ShiftStatus } from "@hottime/types";
import type { AttendanceEntity } from "@hottime/types";

const prisma = new PrismaClient();

//#region Select
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
} as const;

const shiftSelect = {
  id: true,
  organizationId: true,
  userId: true,
  startsAt: true,
  endsAt: true,
  actualStartsAt: true,
  actualEndsAt: true,
  status: true,
  published: true,
} as const;

type ShiftRecord = {
  id: number;
  organizationId: number;
  userId: number;
  startsAt: Date;
  endsAt: Date;
  actualStartsAt: Date | null;
  actualEndsAt: Date | null;
  status: ShiftStatus;
  published: boolean;
};
//#endregion

//#region Create
// Create attendance
export async function createAttendance(data: {
  shiftId: number;
  userId: number;
  organizationId: number;
  type: AttendanceType;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  occurredAt: Date;
}): Promise<AttendanceEntity> {
  const attendance = await prisma.attendance.create({
    data,
    select: attendanceSelect,
  });
  return toAttendanceEntity(attendance);
}
//#endregion

//#region Get
// Get shift by id
export async function getShiftById(
  shiftId: number,
  organizationId: number
): Promise<ShiftRecord | null> {
  return prisma.shift.findFirst({
    where: {
      id: shiftId,
      organizationId,
    },
    select: shiftSelect,
  });
}
// Get attendance by id
export async function findAttendanceById(
  attendanceId: number,
  organizationId: number
): Promise<AttendanceEntity | null> {
  const attendance = await prisma.attendance.findFirst({
    where: {
      id: attendanceId,
      organizationId,
    },
    select: attendanceSelect,
  });
  return attendance ? toAttendanceEntity(attendance) : null;
}
// Get attendance by shiftid
export async function findAttendanceByShiftAndType(
  shiftId: number,
  type: AttendanceType,
  organizationId: number,
  excludeAttendanceId?: number
): Promise<AttendanceEntity | null> {
  const attendance = await prisma.attendance.findFirst({
    where: {
      shiftId,
      organizationId,
      type,
      ...(excludeAttendanceId && {
        id: {
          not: excludeAttendanceId,
        },
      }),
    },
    select: attendanceSelect,
  });
  return attendance ? toAttendanceEntity(attendance) : null;
}
// Get attendances list
export async function getAttendances(filters: {
  attendanceId?: number;
  userId?: number;
  shiftId?: number;
  type?: AttendanceType;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}, organizationId: number): Promise<{
  attendances: AttendanceEntity[];
  total: number;
}> {
  const {
    attendanceId,
    userId,
    shiftId,
    type,
    from,
    to,
    limit = 50,
    offset = 0,
  } = filters;
  const where = {
    organizationId,
    ...(attendanceId !== undefined && { id: attendanceId }),
    ...(userId !== undefined && { userId }),
    ...(shiftId !== undefined && { shiftId }),
    ...(type !== undefined && { type }),
    ...((from !== undefined || to !== undefined)
      ? {
          occurredAt: {
            ...(from !== undefined && { gte: from }),
            ...(to !== undefined && { lte: to }),
          },
        }
      : {}),
  };
  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: limit,
      skip: offset,
      select: attendanceSelect,
    }),
    prisma.attendance.count({ where }),
  ]);

  return {
    attendances: attendances.map(toAttendanceEntity),
    total,
  };
}
//#endregion

//#region Update
// Update shift by id
export async function updateShiftById(
  shiftId: number,
  data: {
    status?: ShiftStatus;
    actualStartsAt?: Date | null;
    actualEndsAt?: Date | null;
  }
) {
  return prisma.shift.update({
    where: { id: shiftId },
    data: {
      ...(data.status !== undefined && { status: data.status }),
      ...(data.actualStartsAt !== undefined && {
        actualStartsAt: data.actualStartsAt,
      }),
      ...(data.actualEndsAt !== undefined && {
        actualEndsAt: data.actualEndsAt,
      }),
    },
    select: shiftSelect,
  });
}
// Update attendance by id
export async function updateAttendanceById(
  attendanceId: number,
  data: {
    shiftId?: number;
    userId?: number;
    organizationId?: number;
    type?: AttendanceType;
    latitude?: number;
    longitude?: number;
    distanceMeters?: number;
    occurredAt?: Date;
  }
): Promise<AttendanceEntity> {
  const attendance = await prisma.attendance.update({
    where: {
      id: attendanceId,
    },
    data: {
      ...(data.shiftId !== undefined && { shiftId: data.shiftId }),
      ...(data.userId !== undefined && { userId: data.userId }),
      ...(data.organizationId !== undefined && {
        organizationId: data.organizationId,
      }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
      ...(data.distanceMeters !== undefined && {
        distanceMeters: data.distanceMeters,
      }),
      ...(data.occurredAt !== undefined && { occurredAt: data.occurredAt }),
    },
    select: attendanceSelect,
  });
  return toAttendanceEntity(attendance);
}
//#endregion

//#region Delete
// Delete attendace by id
export async function deleteAttendanceById(
  attendanceId: number
): Promise<AttendanceEntity> {
  const attendance = await prisma.attendance.delete({
    where: { id: attendanceId },
    select: attendanceSelect,
  });
  return toAttendanceEntity(attendance);
}
//#endregion

// Formato attendance entity
function toAttendanceEntity(attendance: AttendanceEntity): AttendanceEntity {
  return attendance;
}