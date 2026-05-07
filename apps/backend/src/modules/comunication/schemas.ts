import { z } from "zod";
import type { CreateCommunicationDto } from "@hottime/types";

const readQueryValue = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return value;
}, z.boolean().optional());

export const createCommunicationSchema = z.object({
  title: z.string().min(3).max(150),
  content: z.string().min(1).max(10000),
  type: z.enum(["GENERAL", "INFO", "WARNING", "URGENT"]),
  recipientMode: z.enum(["ALL_USERS", "USERS", "CATEGORIES"]).default("ALL_USERS"),
  recipientUserIds: z.array(z.coerce.number().int().positive()).default([]),
  recipientCategoryIds: z.array(z.coerce.number().int().positive()).default([]),
  recipientWithoutCategory: z.boolean().default(false),
}).strict();
export type CreateCommunicationInput = CreateCommunicationDto;

export const getInboxSchema = z.object({
  read: readQueryValue,
}).strict();

export const getCommunicationIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
