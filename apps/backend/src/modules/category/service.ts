import { httpError } from "../../lib/httpError";
import * as repo from "./reporitory";

// GET
export async function getCategories(organizationId: number) {
  return repo.findAllByOrganization(organizationId);
}

export async function getUsersFromCategory(
  categoryId: number,
  organizationId: number
) {
  const category = await repo.findById(categoryId);

  if (!category || category.organizationId !== organizationId) {
    throw httpError("Category not found in your organization", 404, "CATEGORY_NOT_FOUND");
  }

  return repo.getUsersByCategory(categoryId, organizationId);
}

// CREATE
export async function createCategory(
  name: string,
  organizationId: number
) {
  return repo.create({
    name,
    organizationId,
  });
}

// UPDATE
export async function updateCategory(
  id: number,
  name: string,
  organizationId: number
) {
  const category = await repo.findById(id);

  if (!category || category.organizationId !== organizationId) {
    throw httpError("Category not found in your organization", 404, "CATEGORY_NOT_FOUND");
  }

  return repo.updateName(id, name);
}

// DELETE
export async function deleteCategory(
  id: number,
  organizationId: number
) {
  const category = await repo.findById(id);

  if (!category || category.organizationId !== organizationId) {
    throw httpError("Category not found in your organization", 404, "CATEGORY_NOT_FOUND");
  }

  await repo.unassignUsers(id);

  return repo.deleteCategory(id);
}