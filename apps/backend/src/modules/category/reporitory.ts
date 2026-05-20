import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

//#region Create
// Create category 
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

//#region Get
// Find organization by id
export async function findOrganizationById(id: number) {
  return prisma.organization.findUnique({
    where: { id },
  });
}
// Find category by organization 
export function findByOrganization(organizationId: number) {
  return prisma.category.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
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
    where: { userCategories: { some: { categoryId } } },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      birthDate: true,
      phone: true,
      imgProfile: true,
      organizationId: true,
      initDate: true,
      userCategories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { category: { name: "asc" } },
      },
    },
  }).then((users) => users.map((user) => {
    const { userCategories, ...rest } = user;
    return {
      ...rest,
      categories: userCategories.map((item) => item.category),
    };
  }));
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

//#region  Update
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
// Delete user-category links
export function clearUsersCategoryTx(tx: Prisma.TransactionClient, categoryId: number) {
  return tx.userCategory.deleteMany({
    where: { categoryId },
  });
}
//#endregion

//#region DELETE
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
