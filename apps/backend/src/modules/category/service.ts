import * as repo from "./reporitory";

export async function getCategories(organizationId: number) {
  return repo.findAllByOrganization(organizationId);
}

// 👤 USERS POR CATEGORÍA (SEGURA)
export async function getUsersFromCategory(
  categoryId: number,
  organizationId: number
) {
  const category = await repo.findById(categoryId);

  // 🔒 VALIDACIÓN MULTI-TENANT
  if (!category || category.organizationId !== organizationId) {
    throw new Error("Category not found in your organization");
  }

  return repo.getUsersByCategory(categoryId, organizationId);
}

export async function createCategory(
  name: string,
  organizationId: number
) {
  return repo.create({
    name,
    organizationId,
  });
}

export async function updateCategory(
  id: number,
  name: string,
  organizationId: number
) {
  const category = await repo.findById(id);

  if (!category || category.organizationId !== organizationId) {
    throw new Error("Category not found in your organization");
  }

  return repo.updateName(id, name);
}

export async function deleteCategory(
  id: number,
  organizationId: number
) {
  const category = await repo.findById(id);

  if (!category || category.organizationId !== organizationId) {
    throw new Error("Category not found in your organization");
  }

  // 🔥 usuarios pasan a "sin categoría"
  await repo.unassignUsers(id);

  return repo.deleteCategory(id);
}