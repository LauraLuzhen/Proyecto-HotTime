import type { GetCategoriesFn, GetUsersByCategoryFn, CreateCategoryFn, UpdateCategoryFn, DeleteCategoryFn } from "@hottime/types";
import { httpError } from "@/lib/httpError";
import * as repo from "@/modules/category/reporitory";
import { CreateCategoryInput, UpdateCategoryInput } from "./schemas";

// Create category by ADMIN
export const createCategory: CreateCategoryFn = async (data: CreateCategoryInput, organizationId: number) => {
  const existing = await repo.findByNameAndOrganization(data.name, organizationId);
  if (existing) throw httpError("Category already exists", 409, "CATEGORY_ALREADY_EXISTS");

  return repo.create({
    name: data.name,
    organizationId,
  });
};

// Get categories
export const getCategories: GetCategoriesFn = async (organizationId) => {
  const org = await repo.findOrganizationById(organizationId);
  if (!org) throw httpError("Organization not found", 404, "ORGANIZATION_NOT_FOUND");

  return repo.findByOrganization(organizationId);
};

// Get users by category
export const getUsersByCategory: GetUsersByCategoryFn = async (categoryId: number, organizationId: number) => {
  const category = await repo.findById(categoryId);
  if (!category) throw httpError("Category not found", 404, "CATEGORY_NOT_FOUND");
  if (category.organizationId !== organizationId) throw httpError("Category does not belong to your organization", 403, "CATEGORY_FORBIDDEN");

  return repo.findUsersByCategory(categoryId);
};

// Update category by ADMIN
export const updateCategory: UpdateCategoryFn = async (categoryId: number, organizationId: number, data: UpdateCategoryInput) => {
  const category = await repo.findById(categoryId);
  if (!category) throw httpError("Category not found", 404, "CATEGORY_NOT_FOUND");
  if (category.organizationId !== organizationId) throw httpError("Category does not belong to your organization", 403, "CATEGORY_FORBIDDEN");

  if (data.name) {
    const existing = await repo.findByNameAndOrganization(
      data.name,
      organizationId
    );

    if (existing && existing.id !== categoryId) throw httpError("Category already exists", 409, "CATEGORY_ALREADY_EXISTS");
  }
  return repo.update(categoryId, data);
};

// Delete category by ADMIN
export const deleteCategory: DeleteCategoryFn = async (categoryId: number, organizationId: number) => {
  const category = await repo.findById(categoryId);
  if (!category) throw httpError("Category not found", 404, "CATEGORY_NOT_FOUND");
  if (category.organizationId !== organizationId) throw httpError("Category does not belong to your organization", 403, "CATEGORY_FORBIDDEN");

  await repo.deleteCategoryWithUsers(categoryId);
  return { success: true };
};
