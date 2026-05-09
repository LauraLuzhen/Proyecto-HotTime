import { z } from "zod";
import type { UpdateOrganizationDto } from "@hottime/types";

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  allowedRadiusMeters: z.number().int().min(10).max(5000).nullable().optional(),
}).strict();

export type UpdateOrganizationInput = UpdateOrganizationDto;
