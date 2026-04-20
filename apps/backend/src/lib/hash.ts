import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

// Hashear contraseña
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}