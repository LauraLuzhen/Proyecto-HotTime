import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");
  
  const hash = await bcrypt.hash("123456", 10);

  // =========================
  // CLEAN (opcional pero recomendado en dev)
  // =========================
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.organization.deleteMany();

  // =========================
  // ORGANIZATIONS
  // =========================
  const muerde = await prisma.organization.create({
    data: { name: "Muerde la Pasta" },
  });

  const nervion = await prisma.organization.create({
    data: { name: "Nervión" },
  });

  // =========================
  // CATEGORIES (solo Muerde la Pasta)
  // =========================
  const cocina = await prisma.category.create({
    data: {
      name: "cocina",
      organizationId: muerde.id,
    },
  });

  const sala = await prisma.category.create({
    data: {
      name: "sala",
      organizationId: muerde.id,
    },
  });

  const office = await prisma.category.create({
    data: {
      name: "office",
      organizationId: muerde.id,
    },
  });

  // =========================
  // USERS - MUERDE LA PASTA (4 USERS)
  // =========================
  await prisma.user.createMany({
    data: [
      {
        fullName: "Admin Muerde",
        email: "admin@muerde.com",
        password: hash,
        role: Role.ADMIN,
        birthDate: new Date("1990-01-01"),
        initDate: new Date("2020-01-01"),
        phone: "600000001",
        organizationId: muerde.id,
        categoryId: null,
      },
      {
        fullName: "Manager Muerde",
        email: "manager@muerde.com",
        password: hash,
        role: Role.MANAGER,
        birthDate: new Date("1991-02-02"),
        initDate: new Date("2023-01-01"),
        phone: "600000002",
        organizationId: muerde.id,
        categoryId: cocina.id,
      },
      {
        fullName: "Empleado Cocina",
        email: "cocina@muerde.com",
        password: hash,
        role: Role.EMPLOYEE,
        birthDate: new Date("1995-03-03"),
        initDate: new Date("2025-01-01"),
        phone: "600000003",
        organizationId: muerde.id,
        categoryId: cocina.id,
      },
      {
        fullName: "Empleado Sin Categoria",
        email: "nocat@muerde.com",
        password: hash,
        role: Role.EMPLOYEE,
        birthDate: new Date("1996-04-04"),
        initDate: new Date("2025-01-02"),
        phone: "600000004",
        organizationId: muerde.id,
        categoryId: office.id,
      },
    ],
  });

  // =========================
  // USERS - NERVIÓN (1 ADMIN)
  // =========================
  await prisma.user.create({
    data: {
      fullName: "Admin Nervión",
      email: "admin@nervion.com",
      password: hash,
      role: Role.ADMIN,
      birthDate: new Date("1990-01-01"),
      initDate: new Date("2020-01-01"),
      phone: "600000010",
      organizationId: nervion.id,
      categoryId: null,
    },
  });

  console.log("✅ Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });