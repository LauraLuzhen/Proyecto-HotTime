import { PrismaClient, type Prisma } from "@prisma/client";
import { httpError } from "@/lib/httpError";
import type { CreateUserResponse, GetUsersQueryDto } from "@hottime/types";

const prisma = new PrismaClient();

//#region GET
// Count users by organization id
export async function countByOrganization(organizationId: number) {
  return prisma.user.count({
    where: { organizationId },
  });
}

// Find by email
export async function findByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");
  return user;
}
export function findByEmailOrNull(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

// Find by id
export async function findById(id: number) {
  const user = await prisma.user.findUnique({ 
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      birthDate: true,
      initDate: true,
      phone: true,
      imgProfile: true,
      categoryId: true,
      organizationId: true,
    }
  });

  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");
  return user;
}

// Find by reset token
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

// Find by category id
export async function findCategoryById(id: number) {
  const category = await prisma.category.findUnique({where: { id }});
  if (!category) throw httpError("Category not found", 404, "CATEGORY_NOT_FOUND");
  return category;
}

// Find all by organization + filters
export function findAllByOrganization(organizationId: number, filters: GetUsersQueryDto, userId: number) {
  return prisma.user.findMany({
    where: {
      organizationId,
      NOT: {id: userId},
      role: filters.role,
      categoryId: filters.categoryId,
      fullName: filters.fullName
        ? {
            contains: filters.fullName,
            mode: "insensitive",
          }
        : undefined,
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
//#endregion

//#region UPDATE
// Update password
export function updatePassword(userId: number, password: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { password },
  });
}

// Update reset token
export function setResetToken(userId: number, token: string | null) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      resetToken: token,
      resetTokenExp: token ? new Date(Date.now() + 1000 * 60 * 15) : null, // 15 min
    },
  });
}

// Update user
export function updateUser(userId: number, data: any) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      birthDate: true,
      initDate: true,
      phone: true,
      imgProfile: true,
      organizationId: true,
      categoryId: true,
    },
  });
}
//#endregion

//#region CREATE
export type CreateUserInput = Prisma.UserUncheckedCreateInput;
export function create(data: CreateUserInput): Promise<CreateUserResponse> {
  return prisma.user.create({
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      birthDate: true,
      phone: true,
      categoryId: true,
      initDate: true,
      organizationId: true,
    },
  });
}
//#endregion

//#region DELETE
export function deleteById(id: number): Promise<CreateUserResponse> {
  return prisma.user.delete({
    where: { id }
  });
}
//#endregion
