import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function create(data: any) {
  return prisma.user.create({ data });
}

export function findAll() {
  return prisma.user.findMany();
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
