import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🟢Seeding database...");
  
  // Contraseña común de todos los usuarios
  const hash = await bcrypt.hash("Password1.", 10);

  // Clean BD
  await prisma.userCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.organization.deleteMany();

  // Table Organizations
  const muerde = await prisma.organization.create({
    data: {
      name: "Muerde la Pasta",
      latitude: 37.3890924,
      longitude: -5.9844589,
      allowedRadiusMeters: 150,
    },
  });
  const nervion = await prisma.organization.create({
    data: {
      name: "Nervión",
      latitude: 37.383,
      longitude: -5.973,
      allowedRadiusMeters: 150,
    },
  });

  // Table Categories
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

  // Table Users
  await prisma.user.create({
    data: {
      fullName: "Admin Muerde",
      email: "laurarm1002@gmail.com",
      password: hash,
      role: Role.ADMIN,
      birthDate: new Date("1990-01-01"),
      initDate: new Date("2020-01-01"),
      phone: "600000001",
      organizationId: muerde.id,
    },
  });

  await prisma.user.create({
    data: {
      fullName: "Manager Muerde",
      email: "manager@muerde.com",
      password: hash,
      role: Role.MANAGER,
      birthDate: new Date("1991-02-02"),
      initDate: new Date("2023-01-01"),
      phone: "600000002",
      organizationId: muerde.id,
      userCategories: {
        create: [
          { categoryId: cocina.id },
          { categoryId: sala.id },
        ],
      },
    },
  });

  await prisma.user.create({
    data: {
      fullName: "Empleado Cocina",
      email: "cocina@muerde.com",
      password: hash,
      role: Role.EMPLOYEE,
      birthDate: new Date("1995-03-03"),
      initDate: new Date("2025-01-01"),
      phone: "600000003",
      organizationId: muerde.id,
      userCategories: {
        create: [
          { categoryId: cocina.id },
        ],
      },
    },
  });

  await prisma.user.create({
    data: {
      fullName: "Empleado Sin Categoria",
      email: "nocat@muerde.com",
      password: hash,
      role: Role.EMPLOYEE,
      birthDate: new Date("1996-04-04"),
      initDate: new Date("2025-01-02"),
      phone: "600000004",
      organizationId: muerde.id
    },
  });

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
    },
  });

  console.log("🟢Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("🔴Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
