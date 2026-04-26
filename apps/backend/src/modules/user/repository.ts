import type { Prisma, User } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import type {
  AdminCreateUserDto,
  UpdateMeDto,
  UserFiltersDto,
} from "@hottime/types";

import { httpError } from "@/lib/httpError";

const prisma = new PrismaClient();

// GET
export function findAll(filters: UserFiltersDto, userId: number, organizationId: number) {
  return prisma.user.findMany({
    where: {
      NOT: {
        id: userId,
      },
      organizationId,
      fullName: filters.fullName 
        ? { contains: filters.fullName, mode: 'insensitive' } 
        : undefined,
      role: filters.role || undefined,
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

export async function findById(id: number) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");

  return user;
}

export async function findByResetToken(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExp: {
        gte: new Date(),
      },
    },
  });

  if (!user) throw httpError("Invalid or expired token", 400, "INVALID_TOKEN");

  return user;
}

export async function findCategoryById(id: number) {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) throw httpError("Category not found", 404, "CATEGORY_NOT_FOUND");

  return category;
}

// CREATE
export function create(data: Prisma.UserUncheckedCreateInput) {
  return prisma.user.create({ data });
}

// UPDATE
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

export function updateUser(userId: number, data: UpdateMeDto): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

// DELETE
export async function deleteUser(userId: number) {
  try {
    return await prisma.user.delete({
      where: { id: userId },
    });
  } catch {
    throw httpError("User not found", 404, "USER_NOT_FOUND");
  }
}