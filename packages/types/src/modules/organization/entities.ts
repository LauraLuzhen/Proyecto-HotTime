export interface OrganizationEntity {
  id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  allowedRadiusMeters: number | null;
}
