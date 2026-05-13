import { PrismaClient, type Prisma } from "@prisma/client";
import { httpError } from "@/lib/httpError";
import type { CreateUserResponse, GetUsersQueryDto } from "@hottime/types";

const prisma = new PrismaClient();

const categoriesSelect = {
  category: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.UserCategorySelect;

function mapUserCategories<T extends { userCategories: { category: { id: number; name: string } }[] }>(user: T) {
  const { userCategories, ...rest } = user;
  return {
    ...rest,
    categories: userCategories.map((item) => item.category),
  };
}

function uniqueCategoryIds(categoryIds: number[]) {
  return [...new Set(categoryIds)];
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

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
      organizationId: true,
      userCategories: {
        select: categoriesSelect,
        orderBy: {
          category: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!user) {
    throw httpError("User not found", 404, "USER_NOT_FOUND");
  }

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

export function findCategoriesByIds(ids: number[], organizationId: number) {
  return prisma.category.findMany({
    where: {
      id: { in: uniqueCategoryIds(ids) },
      organizationId,
    },
  });
}

// Find all by organization + filters
export function findAllByOrganization(organizationId: number, filters: GetUsersQueryDto, userId: number) {
  return prisma.user.findMany({
    where: {
      organizationId,
      NOT: {id: userId},
      role: filters.role,
      userCategories: filters.categoryId
        ? {
            some: {
              categoryId: filters.categoryId,
            },
          }
        : undefined,
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
      organizationId: true,
      initDate: true,
      userCategories: {
        select: categoriesSelect,
        orderBy: {
          category: {
            name: "asc",
          },
        },
      },
    },
  }).then((users) => {
    const mapped = users.map(mapUserCategories);

    if (!filters.fullName) {
      return mapped;
    }

    const query = normalizeSearchText(filters.fullName);
    return mapped.filter((user) => normalizeSearchText(user.fullName).includes(query));
  });
}

// Find All + me
export function findAll(organizationId: number, filters: GetUsersQueryDto, userId: number) {
  return prisma.user.findMany({
    where: {
      organizationId,
      role: filters.role,
      userCategories: filters.categoryId
        ? {
            some: {
              categoryId: filters.categoryId,
            },
          }
        : undefined,
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
      organizationId: true,
      initDate: true,
      userCategories: {
        select: categoriesSelect,
        orderBy: {
          category: {
            name: "asc",
          },
        },
      },
    },
  }).then((users) => {
    const mapped = users.map(mapUserCategories);

    if (!filters.fullName) {
      return mapped;
    }

    const query = normalizeSearchText(filters.fullName);
    return mapped.filter((user) => normalizeSearchText(user.fullName).includes(query));
  });
}

// Find user with name category and organization
export function findMeWithRelations(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      phone: true,
      imgProfile: true,
      birthDate: true,
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
        orderBy: {
          category: {
            name: "asc",
          },
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          allowedRadiusMeters: true,
        },
      },
    },
  }).then((user) => user ? mapUserCategories(user) : null);
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
export async function updateUser(userId: number, data: any, categoryIds?: number[]) {
  const user = await prisma.$transaction(async (tx) => {
    const uniqueIds = categoryIds ? uniqueCategoryIds(categoryIds) : [];

    if (categoryIds !== undefined) {
      await tx.userCategory.deleteMany({ where: { userId } });
    }

    return tx.user.update({
      where: { id: userId },
      data: {
        ...data,
        ...(categoryIds !== undefined
          && uniqueIds.length
          ? {
              userCategories: {
                create: uniqueIds.map((categoryId) => ({ categoryId })),
              },
            }
          : {}),
      },
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
        userCategories: {
          select: categoriesSelect,
          orderBy: {
            category: {
              name: "asc",
            },
          },
        },
      },
    });
  });

  return mapUserCategories(user);
}
//#endregion

//#region CREATE
export type CreateUserInput = Omit<Prisma.UserUncheckedCreateInput, "categoryId"> & { categoryIds: number[] };
export async function create(data: CreateUserInput): Promise<CreateUserResponse> {
  const { categoryIds, ...userData } = data;
  const uniqueIds = uniqueCategoryIds(categoryIds);
  const user = await prisma.user.create({
    data: {
      ...userData,
      ...(uniqueIds.length
        ? {
            userCategories: {
              create: uniqueIds.map((categoryId) => ({ categoryId })),
            },
          }
        : {}),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      birthDate: true,
      phone: true,
      initDate: true,
      organizationId: true,
      userCategories: {
        select: categoriesSelect,
        orderBy: {
          category: {
            name: "asc",
          },
        },
      },
    },
  });

  return mapUserCategories(user);
}
//#endregion

//#region DELETE
export function deleteById(id: number) {
  return prisma.user.delete({
    where: { id }
  });
}
//#endregion
