import { randomUUID } from "crypto";

import { comparePassword, hashPassword } from "../../lib/hash";
import { httpError } from "../../lib/httpError";
import { signToken } from "../../lib/jwt";
import { LoginInput } from "./schemas";
import * as userRepo from "../user/repository";

// LogIn
export async function login(data: LoginInput) {
  const user = await userRepo.findByEmail(data.email);

  if (!user) throw httpError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  const isValid = await comparePassword(
    data.password,
    user.password
  );

  if (!isValid) throw httpError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  return {
    token: signToken({
      id: user.id,
      role: user.role,
      organizationId: user.organizationId,
    }),
    user
  };
}

// Forgot password
export async function forgotPassword(email: string) {
  const user = await userRepo.findByEmail(email);

  if (!user) return { message: "If email exists, reset link sent" };

  const token = randomUUID();

  await userRepo.setResetToken(user.id, token);

  console.log(`RESET LINK: http://localhost:5173/reset-password?token=${token}`);

  return { message: "Reset email sent" };
}

// Reset password
export async function resetPassword(token: string, password: string) {
  const user = await userRepo.findByResetToken(token);

  if (!user) throw httpError("Invalid or expired token", 400, "INVALID_TOKEN");

  const hashed = await hashPassword(password);

  await userRepo.updatePassword(user.id, hashed);

  await userRepo.setResetToken(user.id, null);

  return { message: "Password updated" };
}