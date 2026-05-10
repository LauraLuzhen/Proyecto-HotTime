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
