export interface OrganizationResponse {
  id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  allowedRadiusMeters: number | null;
}

export interface UpdateOrganizationDto {
  name?: string;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
}
