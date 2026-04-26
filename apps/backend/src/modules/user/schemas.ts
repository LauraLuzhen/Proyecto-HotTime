import { z } from "zod";

export const adminCreateUserSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  password: z.string().min(8),

  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),

  birthDate: z.string(),
  initDate: z.string(),

  phone: z.string(),

  imgProfile: z.string().optional(),

  categoryId: z.number().nullable().optional(),
});

export const updateMeSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  imgProfile: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "1 mayúscula")
    .regex(/[a-z]/, "1 minúscula")
    .regex(/[0-9]/, "1 número")
    .regex(/[^A-Za-z0-9]/, "1 carácter especial"),
});