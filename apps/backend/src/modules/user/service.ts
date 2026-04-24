import * as repo from "./repository";
import { hashPassword, comparePassword } from "../../lib/hash";

export async function createUser(data: any) {
  // 🔐 HASHEAR PASSWORD
  const hashedPassword = await hashPassword(data.password);

  return repo.create({
    ...data,
    password: hashedPassword,
    birthDate: new Date(data.birthDate),
    initDate: new Date(data.initDate),
  });
}

export async function getUsers(filters: any) {
  return repo.findAll(filters);
}

// 👤 GET ME
export async function getMyUser(userId: number) {
  const user = await repo.findById(userId);

  if (!user) throw new Error("User not found");

  const { password, resetToken, ...safe } = user;

  return safe;
}

// ✏️ UPDATE PERFIL (email, phone, img)
export async function updateMyUser(userId: number, data: any) {
  return repo.updateUser(userId, data);
}

// 🔐 CHANGE PASSWORD
export async function changeMyPassword(
  userId: number,
  currentPassword: string,
  newPassword: string
) {
  const user = await repo.findById(userId);

  if (!user) throw new Error("User not found");

  const isValid = await comparePassword(
    currentPassword,
    user.password
  );

  if (!isValid) {
    throw new Error("Current password incorrect");
  }

  const hashed = await hashPassword(newPassword);

  return repo.updatePassword(userId, hashed);
}