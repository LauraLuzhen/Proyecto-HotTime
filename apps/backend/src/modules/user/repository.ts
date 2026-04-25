import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function create(data: any) {
  return prisma.user.create({ data });
}

export function findAll(filters: any, userId: number, organizationId: number) {
  return prisma.user.findMany({
    where: {
      // ❌ EXCLUIRME
      NOT: {
        id: userId,
      },
      organizationId,

      // Filtro de texto parcial (ignora mayúsculas/minúsculas con mode: 'insensitive')
      fullName: filters.fullName 
        ? { contains: filters.fullName, mode: 'insensitive' } 
        : undefined,

      // Filtro exacto
      role: filters.role || undefined,

      // Filtros numéricos
      categoryId: filters.categoryId ? Number(filters.categoryId) : undefined
    },
    include: {
      category: true,
      organization: true,
    },
  });
}

export function findByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export function findById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}

export function updatePassword(userId: number, password: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { password },
  });
}

export function setResetToken(userId: number, token: string | null) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      resetToken: token,
      resetTokenExp: token ? new Date(Date.now() + 1000 * 60 * 15) : null, // 15 min
    },
  });
}

export function findByResetToken(token: string) {
  return prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExp: {
        gte: new Date(), // no expirado
      },
    },
  });
}

export function updateUser(userId: number, data: any) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

export function deleteUser(userId: number) {
  return prisma.user.delete({
    where: { id: userId },
  });
}

export function findCategoryById(id: number) {
  return prisma.category.findUnique({
    where: { id },
  });
}