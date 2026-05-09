import { z } from "zod";
import type { AttendanceQueryDto, ClockDto, CreateManyShiftsDto, CreateShiftDto, PlanningRangeQueryDto, PlanningUserQueryDto, UpdateShiftDto } from "@hottime/types";

const shiftStatusSchema = z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "MISSED", "CANCELLED"]);
const attendanceTypeSchema = z.enum(["CLOCK_IN", "CLOCK_OUT"]);
const userIdsQuerySchema = z.preprocess((value) => {
  if (typeof value === "string") return value.split(",").filter(Boolean);
  return value;
}, z.array(z.coerce.number().int().positive()).optional());
const categoryQuerySchema = z.preprocess((value) => {
  if (value === "none" || value === "null") return null;
  return value;
}, z.coerce.number().int().positive().nullable().optional());

const optionalNullableDate = z.preprocess(
  (value) => value === null ? null : value,
  z.coerce.date().nullable()
);

export const shiftIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createShiftSchema = z.object({
  userId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  published: z.boolean().optional(),
}).strict();
export type CreateShiftInput = CreateShiftDto;

export const createManyShiftsSchema = z.object({
  userIds: z.array(z.coerce.number().int().positive()).min(1).optional(),
  allUsers: z.boolean().optional(),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  published: z.boolean().optional(),
}).strict().refine((data) => data.allUsers || data.userIds?.length, {
  message: "Select users or allUsers",
  path: ["userIds"],
});
export type CreateManyShiftsInput = CreateManyShiftsDto;

export const updateShiftSchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  actualStartsAt: optionalNullableDate.optional(),
  actualEndsAt: optionalNullableDate.optional(),
  status: shiftStatusSchema.optional(),
  published: z.boolean().optional(),
}).strict();
export type UpdateShiftInput = UpdateShiftDto;

export const planningRangeQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  userId: z.coerce.number().int().positive().optional(),
  userIds: userIdsQuerySchema,
  categoryId: categoryQuerySchema,
  status: shiftStatusSchema.optional(),
  published: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
}).strict();
export type PlanningRangeQueryInput = PlanningRangeQueryDto;

export const planningUserQuerySchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
}).strict();
export type PlanningUserQueryInput = PlanningUserQueryDto;

export const clockSchema = z.object({
  shiftId: z.coerce.number().int().positive(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  occurredAt: z.coerce.date().optional(),
}).strict();
export type ClockInput = ClockDto;

export const attendanceQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  userId: z.coerce.number().int().positive().optional(),
  userIds: userIdsQuerySchema,
  shiftId: z.coerce.number().int().positive().optional(),
  type: attendanceTypeSchema.optional(),
}).strict();
export type AttendanceQueryInput = AttendanceQueryDto;
