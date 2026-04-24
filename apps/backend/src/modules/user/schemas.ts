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

// 👤 UPDATE PERFIL (email, phone, img)
export const updateMeSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  imgProfile: z.string().optional(),
});

// 🔐 CHANGE PASSWORD
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