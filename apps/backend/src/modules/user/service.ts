import { httpError } from "../../lib/httpError";
import { hashPassword, comparePassword } from "../../lib/hash";

import * as repo from "./repository";

// GET
export async function getUsers(filters: any, userId: number, organizationId: number) {
  return repo.findAll(filters, userId, organizationId);
}

export async function getMyUser(userId: number) {
  const user = await repo.findById(userId);

  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");

  const { password, resetToken, ...safe } = user;

  return safe;
}

// CREATE
export async function createUser(data: any, organizationId: number) {
  const hashedPassword = await hashPassword(data.password);

  return repo.create({
    ...data,
    organizationId,
    password: hashedPassword,
    birthDate: new Date(data.birthDate),
    initDate: new Date(data.initDate),
  });
}

export async function adminCreateUser(data: any, organizationId: number) {
  const hashedPassword = await hashPassword(data.password);

  if (data.categoryId) {
    const category = await repo.findCategoryById(data.categoryId);

    if (!category) throw httpError("Category not found", 404, "CATEGORY_NOT_FOUND");

    if (category.organizationId !== organizationId) throw httpError("Category does not belong to your organization", 403, "CATEGORY_FORBIDDEN");

  }

  return repo.create({
    ...data,
    organizationId,
    password: hashedPassword,
    birthDate: new Date(data.birthDate),
    initDate: new Date(data.initDate),
  });
}

// UPDATE
export async function updateMyUser(userId: number, data: any) {
  return repo.updateUser(userId, data);
}

export async function changeMyPassword(
  userId: number,
  currentPassword: string,
  newPassword: string
) {
  const user = await repo.findById(userId);

  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");

  const isValid = await comparePassword(currentPassword, user.password);

  if (!isValid) throw httpError("Current password incorrect", 400, "INVALID_PASSWORD");

  const hashed = await hashPassword(newPassword);

  return repo.updatePassword(userId, hashed);
}

// DELETE
export async function adminDeleteUser(userId: number) {
  const user = await repo.findById(userId);

  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");

  return repo.deleteUser(userId);
}