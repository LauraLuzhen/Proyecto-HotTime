import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET
export function findById(id: number) {
  return prisma.category.findUnique({
    where: { id },
  });
}

export function findAllByOrganization(organizationId: number) {
  return prisma.category.findMany({
    where: { organizationId },
  });
}

export function getUsersByCategory(
  categoryId: number,
  organizationId: number
) {
  return prisma.user.findMany({
    where: {
      categoryId,
      organizationId,
    },
    include: {
      category: true,
      organization: true,
    },
  });
}

// CREATE
export function create(data: any) {
  return prisma.category.create({
    data,
  });
}

// UPDATE
export function updateName(id: number, name: string) {
  return prisma.category.update({
    where: { id },
    data: { name },
  });
}

export function unassignUsers(categoryId: number) {
  return prisma.user.updateMany({
    where: { categoryId },
    data: { categoryId: null },
  });
}

// DELETE
export function deleteCategory(id: number) {
  return prisma.category.delete({
    where: { id },
  });
}