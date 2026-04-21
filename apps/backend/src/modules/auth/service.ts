import * as userRepo from "../user/repository";
import { comparePassword } from "../../lib/hash";
import { LoginInput } from "./schemas";

export async function login(data: LoginInput) {
  const user = await userRepo.findByEmail(data.email);

  // 🔍 validar existencia
  if (!user) {
    throw new Error("Invalid credentials");
  }

  // 🔐 comparar password
  const isValid = await comparePassword(
    data.password,
    user.password
  );

  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  // 🚀 devolver usuario sin password
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };
}