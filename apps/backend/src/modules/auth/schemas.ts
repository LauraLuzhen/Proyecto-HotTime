import { z } from "zod";
import type { LoginDto, ForgotPasswordDto, ResetPasswordDto } from "@hottime/types";

// LogIn
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = LoginDto;

// Forgot password
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordInput = ForgotPasswordDto;

// Reset password
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "A capital letter")
    .regex(/[a-z]/, "A lowercase")
    .regex(/[0-9]/, "A number")
    .regex(/[^A-Za-z0-9]/, "A special character"),
});
export type ResetPasswordInput = ResetPasswordDto;
