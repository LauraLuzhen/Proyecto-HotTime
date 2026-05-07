import type { CreateUserFn, DeleteUserFn, GetMeFn, GetUsersFn, UpdateMeFn, UpdateUsersFn } from "@hottime/types";
import { httpError } from "@/lib/httpError";
import { hashPassword } from "@/lib/hash";
import * as repo from "@/modules/user/repository";

// Create user
export const createUser: CreateUserFn = async (data, organizationId) => {
  const existingUser = await repo.findByEmailOrNull(data.email);
  if (existingUser) throw httpError("Email already exists", 409, "EMAIL_ALREADY_EXISTS");

  await validateCategoryIds(data.categoryIds, organizationId);

  const hashedPassword = await hashPassword(data.password);
  const user = await repo.create({
    ...data,
    password: hashedPassword,
    initDate: new Date(),
    organizationId,
  });

  return user;
};

// Get me
export const getMe: GetMeFn = async (userId: number) => {
  const user = await repo.findMeWithRelations(userId);
  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");
  return user;
};

// Get users
export const getUsers: GetUsersFn = async (organizationId, filters, userId) => {
  const orgUsers = await repo.countByOrganization(organizationId);
  if (!orgUsers) throw httpError("Organization not found", 404, "ORGANIZATION_NOT_FOUND");

  return repo.findAllByOrganization(organizationId, filters, userId);
};

// Update me
export const updateMe: UpdateMeFn = async (userId, data) => {
  const user = await repo.findById(userId);
  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");

  const updateData: any = { ...data };

  if (data.password) updateData.password = await hashPassword(data.password);

  return repo.updateUser(userId, updateData);
};

// Update users by ADMIN
export const updateUsers: UpdateUsersFn = async (userId, adminOrganizationId, currentUserId, data) => {
  const user = await repo.findById(userId);
  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");

  if (user.organizationId !== adminOrganizationId) throw httpError("User does not belong to your organization", 403, "USER_FORBIDDEN");
  if (user.id === currentUserId) throw httpError("Use /users/me to update your own account", 400, "CANNOT_UPDATE_SELF");

  if (data.email && data.email !== user.email) {
    const existingUser = await repo.findByEmailOrNull(data.email);
    if (existingUser) throw httpError("Email already exists", 409, "EMAIL_ALREADY_EXISTS");
  }

  const { categoryIds, ...rest } = data;
  const updateData: any = { ...rest };
  if (data.password) updateData.password = await hashPassword(data.password);

  if (categoryIds !== undefined) await validateCategoryIds(categoryIds, adminOrganizationId);
  return repo.updateUser(userId, updateData, categoryIds);
};

// Delete user
export const deleteUser: DeleteUserFn = async (userId, organizationId, currentUserId) => {
  const user = await repo.findById(userId);
  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");

  if (user.organizationId !== organizationId) throw httpError("User does not belong to your organization", 403, "USER_FORBIDDEN");
  if (user.id === currentUserId) throw httpError("You cannot delete your own account", 400, "CANNOT_DELETE_SELF");

  await repo.deleteById(userId);
  return { success: true };
};

async function validateCategoryIds(categoryIds: number[], organizationId: number) {
  const uniqueIds = [...new Set(categoryIds)];
  if (uniqueIds.length === 0) return;

  const categories = await repo.findCategoriesByIds(uniqueIds, organizationId);
  if (categories.length !== uniqueIds.length) {
    throw httpError("One or more categories do not belong to your organization", 403, "CATEGORY_FORBIDDEN");
  }
}
