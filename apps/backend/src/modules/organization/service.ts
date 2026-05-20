import type { GetOrganizationFn, UpdateOrganizationFn } from "@hottime/types";
import { httpError } from "@/lib/httpError";
import * as repo from "@/modules/organization/repository";
import type { UpdateOrganizationInput } from "./schemas";

// Comrpueba que ambas coordinadas estén introducidas para update
function hasOneCoordinate(data: UpdateOrganizationInput) {
  return (data.latitude === undefined) !== (data.longitude === undefined);
}

//#region Get
// Get organization
export const getOrganization: GetOrganizationFn = async (organizationId) => {
  const organization = await repo.findById(organizationId);
  if (!organization) throw httpError("Organization not found", 404, "ORGANIZATION_NOT_FOUND");
  return organization;
};
//#endregion

//#region Update
// Update organization
export const updateOrganization: UpdateOrganizationFn = async (organizationId, data: UpdateOrganizationInput) => {
  const organization = await repo.findById(organizationId);
  if (!organization) throw httpError("Organization not found", 404, "ORGANIZATION_NOT_FOUND");
  if (hasOneCoordinate(data)) throw httpError("Latitude and longitude must be updated together", 400, "INVALID_ORGANIZATION_LOCATION");
  const nextLatitude = data.latitude === undefined ? organization.latitude : data.latitude;
  const nextLongitude = data.longitude === undefined ? organization.longitude : data.longitude;
  const nextRadius = data.allowedRadiusMeters === undefined ? organization.allowedRadiusMeters : data.allowedRadiusMeters;
  if ((nextLatitude === null || nextLongitude === null) && nextRadius !== null) throw httpError("Allowed radius requires latitude and longitude", 400, "INVALID_ORGANIZATION_LOCATION");
  if (nextLatitude !== null && nextLongitude !== null && nextRadius === null) throw httpError("Location requires an allowed radius", 400, "INVALID_ORGANIZATION_RADIUS");
  return repo.update(organizationId, data);
};
//#endregion
