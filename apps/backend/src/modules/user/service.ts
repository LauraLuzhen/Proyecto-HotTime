import * as repo from "./repository";
import { hashPassword, comparePassword } from "../../lib/hash";

export async function createUser(data: any, organizationId: number) {
  // 🔐 HASHEAR PASSWORD
  const hashedPassword = await hashPassword(data.password);

  return repo.create({
    ...data,
    organizationId,
    password: hashedPassword,
    birthDate: new Date(data.birthDate),
    initDate: new Date(data.initDate),
  });
}

export async function getUsers(filters: any, userId: number, organizationId: number) {
  return repo.findAll(filters, userId, organizationId);
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

// 👮 ADMIN: CREATE USER
export async function adminCreateUser(data: any, organizationId: number) {
  const hashedPassword = await hashPassword(data.password);

  // 🔒 VALIDAR CATEGORY
  if (data.categoryId) {
    const category = await repo.findCategoryById(data.categoryId);

    if (!category) {
      throw new Error("Category not found");
    }

    if (category.organizationId !== organizationId) {
      throw new Error("Category does not belong to your organization");
    }
  }

  return repo.create({
    ...data,
    organizationId,
    password: hashedPassword,
    birthDate: new Date(data.birthDate),
    initDate: new Date(data.initDate),
  });
}

// 👮 ADMIN: DELETE USER
export async function adminDeleteUser(userId: number) {
  const user = await repo.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return repo.deleteUser(userId);
}
