import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Debe tener una mayúscula")
    .regex(/[a-z]/, "Debe tener una minúscula")
    .regex(/[0-9]/, "Debe tener un número")
    .regex(/[^A-Za-z0-9]/, "Debe tener un carácter especial"),
});

export type LoginInput = z.infer<typeof loginSchema>;