import { PrismaClient, type Prisma } from "@prisma/client";
import type { UpdateOrganizationDto } from "@hottime/types";

const prisma = new PrismaClient();

export const organizationSelect = {
  id: true,
  name: true,
  latitude: true,
  longitude: true,
  allowedRadiusMeters: true,
} satisfies Prisma.OrganizationSelect;

export function findById(organizationId: number) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: organizationSelect,
  });
}

export function update(organizationId: number, data: UpdateOrganizationDto) {
  return prisma.organization.update({
    where: { id: organizationId },
    data,
    select: organizationSelect,
  });
}
