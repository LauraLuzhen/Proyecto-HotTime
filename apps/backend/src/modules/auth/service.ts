import { comparePassword } from "../../lib/hash";
import { signToken } from "../../lib/jwt";
import * as userRepo from "../user/repository";
import { LoginInput } from "./schemas";

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