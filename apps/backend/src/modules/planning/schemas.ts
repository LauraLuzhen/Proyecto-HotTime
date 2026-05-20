import { z } from "zod";

//#region Create
// Create for user
export const createShiftForUserSchema = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  published: z.boolean().optional(),
  userId: z.coerce.number().int().positive(),
}).strict();
// Create for users
export const createShiftForUsersSchema = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  published: z.boolean().optional(),
  userIds: z
    .array(z.coerce.number().int().positive())
    .min(1),
}).strict();
// Create for category
export const createShiftForCategorySchema = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  published: z.boolean().optional(),
  categoryId: z.coerce.number().int().positive().nullable(),
}).strict();
//#endregion

//#region Get
// Get by id
export const getShiftByIdSchema = z.object({
  shiftId: z.coerce.number().int().positive(),
}).strict();
// Get + filters
export const getShiftsSchema = z.object({
  shiftId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  userIds: z
    .preprocess((val) => {
      if (typeof val === "string") return val.split(",").map(Number);
      return val;
    }, z.array(z.number().int().positive()).optional()),
  categoryId: z.coerce.number().int().positive().optional(),
  published: z
    .preprocess((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return val;
    }, z.boolean().optional()),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "MISSED"]).optional(),
  startsFrom: z.coerce.date().optional(),
  startsTo: z.coerce.date().optional(),
  endsFrom: z.coerce.date().optional(),
  endsTo: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
}).strict();
// Get calendar
export const getCalendarShiftsSchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  date: z.coerce.date().optional(),
  includeNext: z.coerce.boolean().optional(),
  includeWeek: z.coerce.boolean().optional(),
  includeMonth: z.coerce.boolean().optional(),
}).strict();
//#endregion

//#region Update
export const updateShiftBodySchema = z.object({
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  status: z.enum([
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "MISSED",
  ]).optional(),
  published: z.boolean().optional(),
}).strict();
export const shiftIdParamsSchema = z.object({ shiftId: z.coerce.number().int().positive() });
//#endregion
