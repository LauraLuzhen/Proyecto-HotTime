import type { AdminCreateUserDto, AdminCreateUserFn, AdminDeleteUserFn, GetMyUserFn, GetUsersFn, UpdateMeDto, UpdateMyUserFn } from "@hottime/types";
import { httpError } from "@/lib/httpError";
import { hashPassword, comparePassword } from "@/lib/hash";
import * as repo from "@/modules/user/repository";

// GET
export const getUsers: GetUsersFn = async (filters, userId, organizationId) =>
  repo.findAll(filters, userId, organizationId);

export const getMyUser: GetMyUserFn = async (userId: number) => {
  const user = await repo.findById(userId);

  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");

  const { password, resetToken, ...safe } = user;

  return safe;
};

// CREATE
export async function createUser(data: AdminCreateUserDto, organizationId: number) {
  const hashedPassword = await hashPassword(data.password);

  return repo.create({
    ...data,
    organizationId,
    password: hashedPassword,
    birthDate: new Date(data.birthDate),
    initDate: new Date(data.initDate),
  });
}

export const adminCreateUser: AdminCreateUserFn = async (data, organizationId) => {
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
};

// UPDATE
export const updateMyUser: UpdateMyUserFn = async (userId: number, data: UpdateMeDto) =>
  repo.updateUser(userId, data);

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
export const adminDeleteUser: AdminDeleteUserFn = async (userId: number) => {
  const user = await repo.findById(userId);

  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");

  return repo.deleteUser(userId);
};