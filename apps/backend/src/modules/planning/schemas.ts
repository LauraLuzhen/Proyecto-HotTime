import { z } from "zod";

/* =========================
   CREATE FOR USER
========================= */

export const createShiftForUserSchema = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  published: z.boolean().optional(),
  userId: z.coerce.number().int().positive(),
}).strict();

/* =========================
   CREATE FOR USERS
========================= */

export const createShiftForUsersSchema = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  published: z.boolean().optional(),
  userIds: z
    .array(z.coerce.number().int().positive())
    .min(1),
}).strict();

/* =========================
   CREATE FOR CATEGORY
========================= */

export const createShiftForCategorySchema = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  published: z.boolean().optional(),
  categoryId: z.coerce.number().int().positive().nullable(),
}).strict();

/* =========================
   GET SHIFT BY ID
========================= */

export const getShiftByIdSchema = z.object({
  shiftId: z.coerce.number().int().positive(),
}).strict();

/* =========================
   GET SHIFTS (FILTERS)
========================= */

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

/* =========================
   CALENDAR SHIFTS
========================= */

export const getCalendarShiftsSchema = z.object({
  userId: z.coerce.number().int().positive().optional(),

  date: z.coerce.date().optional(),

  includeNext: z.coerce.boolean().optional(),
  includeWeek: z.coerce.boolean().optional(),
  includeMonth: z.coerce.boolean().optional(),
}).strict();