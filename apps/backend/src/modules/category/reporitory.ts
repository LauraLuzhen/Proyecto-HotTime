import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

//#region CREATE
// Create category by ADMIN
export function create(data: {name: string; organizationId: number}) {
  return prisma.category.create({
    data,
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  })
}
//#endregion

//#region GET
// Find organization by id
export async function findOrganizationById(id: number) {
  return prisma.organization.findUnique({
    where: { id },
  });
}

// Find category by organization 
export function findByOrganization(organizationId: number) {
  return prisma.category.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  });
}

// Find category by id
export function findById(id: number) {
  return prisma.category.findUnique({
    where: { id },
  });
}

// Find users by category
export function findUsersByCategory(categoryId: number) {
  return prisma.user.findMany({
    where: {
      categoryId,
    },
    orderBy: {
      fullName: "asc",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      birthDate: true,
      phone: true,
      imgProfile: true,
      categoryId: true,
      organizationId: true,
      initDate: true,
    },
  });
}

// Find category by name and organization
export function findByNameAndOrganization(name: string, organizationId: number) {
  return prisma.category.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive", 
      },
      organizationId,
    },
  });
}
//#endregion

//#region  UPDATE
// Update category by ADMIN
export function update(categoryId: number, data: { name?: string }) {
  return prisma.category.update({
    where: { id: categoryId },
    data,
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  });
}

// Update users to categoryId null
export function clearUsersCategoryTx(tx: Prisma.TransactionClient, categoryId: number) {
  return tx.user.updateMany({
    where: { categoryId },
    data: { categoryId: null },
  });
}
//#endregion

//#region DELETE
// Delete category
export function deleteCategoryTx(tx: Prisma.TransactionClient, categoryId: number) {
  return tx.category.delete({
    where: { id: categoryId },
  });
}

// Delete category and their users change categoryId null
export async function deleteCategoryWithUsers(categoryId: number) {
  return prisma.$transaction(async (tx) => {
    await clearUsersCategoryTx(tx, categoryId);
    await deleteCategoryTx(tx, categoryId);
  });
}
//#endregion
