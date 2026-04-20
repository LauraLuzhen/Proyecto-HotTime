import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  birthDate: z.string(),
  initDate: z.string(),
  phone: z.string(),
  organizationId: z.number(),
  categoryId: z.number().nullable().optional(),
});