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