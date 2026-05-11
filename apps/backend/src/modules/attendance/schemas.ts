import { AttendanceType } from "@prisma/client";
import { z } from "zod";

export const clockAttendanceSchema = z.object({
  shiftId: z.coerce.number().int().positive(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

export const createAttendanceSchema = z.object({
  shiftId: z.coerce.number().int().positive(),
  type: z.nativeEnum(AttendanceType),
  occurredAt: z.coerce.date().optional(),
});

export const updateAttendanceSchema = z.object({
  shiftId: z.coerce.number().int().positive().optional(),
  type: z.nativeEnum(AttendanceType).optional(),
  occurredAt: z.coerce.date().optional(),
});

export const attendanceIdParamsSchema = z.object({
  attendanceId: z.coerce.number().int().positive(),
});

export const getAttendancesSchema = z.object({
  attendanceId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  shiftId: z.coerce.number().int().positive().optional(),
  type: z.nativeEnum(AttendanceType).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});
