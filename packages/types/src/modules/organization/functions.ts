import type { OrganizationResponse, UpdateOrganizationDto } from "./dtos";

export type GetOrganizationFn = (organizationId: number) => Promise<OrganizationResponse>;
export type UpdateOrganizationFn = (organizationId: number, data: UpdateOrganizationDto) => Promise<OrganizationResponse>;
