import { randomUUID } from "crypto";

import { comparePassword, hashPassword } from "../../lib/hash";
import { signToken } from "../../lib/jwt";
import * as userRepo from "../user/repository";
import { LoginInput } from "./schemas";

// LogIn
export async function login(data: LoginInput) {
  const user = await userRepo.findByEmail(data.email);

  // Validar existencia
  if (!user) {
    throw new Error("🟡Invalid credentials");
  }

  // Comparar password
  const isValid = await comparePassword(
    data.password,
    user.password
  );

  if (!isValid) {
    throw new Error("🟡Invalid credentials");
  }

  // Devolver usuario
  return {
    token: signToken({
      id: user.id,
      role: user.role,
      organizationId: user.organizationId,
    }),
    user
  };
}

// 📧 Forgot password
export async function forgotPassword(email: string) {
  const user = await userRepo.findByEmail(email);

  // 🔒 seguridad
  if (!user) {
    return { message: "If email exists, reset link sent" };
  }

  const token = randomUUID();

  await userRepo.setResetToken(user.id, token);

  console.log(
    `RESET LINK: http://localhost:5173/reset-password?token=${token}`
  );

  return { message: "Reset email sent" };
}

export async function resetPassword(token: string, password: string) {
  const user = await userRepo.findByResetToken(token);

  if (!user) {
    throw new Error("Invalid token");
  }

  const hashed = await hashPassword(password);

  await userRepo.updatePassword(user.id, hashed);

  await userRepo.setResetToken(user.id, null);

  return { message: "Password updated" };
}