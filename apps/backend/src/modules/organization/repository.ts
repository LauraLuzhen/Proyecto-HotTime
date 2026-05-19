import { PrismaClient, type Prisma } from "@prisma/client";
import type { UpdateOrganizationDto } from "@hottime/types";

const prisma = new PrismaClient();

//#region Select
const organizationSelect = {
  id: true,
  name: true,
  latitude: true,
  longitude: true,
  allowedRadiusMeters: true,
} satisfies Prisma.OrganizationSelect;
//#endregion

//#region Get
// Get by id
export function findById(organizationId: number) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: organizationSelect,
  });
}
//#endregion

//#region Update
// Update organization
export function update(organizationId: number, data: UpdateOrganizationDto) {
  return prisma.organization.update({
    where: { id: organizationId },
    data,
    select: organizationSelect,
  });
}
//#endregion
