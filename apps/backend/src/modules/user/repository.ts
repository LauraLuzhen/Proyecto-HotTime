import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function create(data: any) {
  return prisma.user.create({ data });
}

export function findAll() {
  return prisma.user.findMany();
}