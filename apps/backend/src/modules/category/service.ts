import type {
  CreateCategoryFn,
  DeleteCategoryFn,
  GetCategoriesFn,
  GetUsersFromCategoryFn,
  UpdateCategoryFn,
} from "@hottime/types";
import { httpError } from "@/lib/httpError";
import * as repo from "@/modules/category/reporitory";

// GET
export const getCategories: GetCategoriesFn = async (organizationId: number) =>
  repo.findAllByOrganization(organizationId);

export const getUsersFromCategory: GetUsersFromCategoryFn = async (
  categoryId: number,
  organizationId: number
) => {
  const category = await repo.findById(categoryId);

  if (!category || category.organizationId !== organizationId) {
    throw httpError("Category not found in your organization", 404, "CATEGORY_NOT_FOUND");
  }

  return repo.getUsersByCategory(categoryId, organizationId);
};

// CREATE
export const createCategory: CreateCategoryFn = async (name: string, organizationId: number) => {
  return repo.create({
    name,
    organizationId,
  });
};

// UPDATE
export const updateCategory: UpdateCategoryFn = async (
  id: number,
  name: string,
  organizationId: number
) => {
  const category = await repo.findById(id);

  if (!category || category.organizationId !== organizationId) {
    throw httpError("Category not found in your organization", 404, "CATEGORY_NOT_FOUND");
  }

  return repo.updateName(id, name);
};

// DELETE
export const deleteCategory: DeleteCategoryFn = async (
  id: number,
  organizationId: number
) => {
  const category = await repo.findById(id);

  if (!category || category.organizationId !== organizationId) {
    throw httpError("Category not found in your organization", 404, "CATEGORY_NOT_FOUND");
  }

  await repo.unassignUsers(id);

  return repo.deleteCategory(id);
};