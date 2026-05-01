import { randomUUID } from "crypto";
import type { LoginFn, ForgotPasswordFn, ResetPasswordFn } from "@hottime/types";
import { comparePassword, hashPassword } from "@/lib/hash";
import { httpError } from "@/lib/httpError";
import { signToken } from "@/lib/jwt";
import * as userRepo from "@/modules/user/repository";
import type { ForgotPasswordInput, LoginInput, ResetPasswordInput } from "@/modules/auth/schemas";

// LogIn
export const login: LoginFn = async (data: LoginInput) => {
  const user = await userRepo.findByEmail(data.email);
  if (!user) throw httpError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  const isValid = await comparePassword(data.password, user.password);
  if (!isValid) throw httpError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  return {
    token: signToken({
      id: user.id,
      role: user.role,
      organizationId: user.organizationId,
    })
  };
};

// Forgot password
export const forgotPassword: ForgotPasswordFn = async (data: ForgotPasswordInput) => {
  const user = await userRepo.findByEmail(data.email);
  if (!user) return { resetToken: "If email exists, reset link sent" };

  const token = randomUUID();
  await userRepo.setResetToken(user.id, token);

  return { resetToken: token };
};

// Reset password
export const resetPassword: ResetPasswordFn = async (data: ResetPasswordInput) => {
  const user = await userRepo.findByResetToken(data.token);
  if (!user) throw httpError("Invalid or expired token", 400, "INVALID_TOKEN");

  const hashed = await hashPassword(data.password);
  await userRepo.updatePassword(user.id, hashed);
  await userRepo.setResetToken(user.id, null);

  return { success: true };
};
