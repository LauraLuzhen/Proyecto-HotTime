import { z } from "zod";
import type { CreateCommunicationDto, DeleteInboxCommunicationsDto } from "@hottime/types";

// Transforma los valores de strig a boolean
const readQueryValue = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return value;
}, z.boolean().optional());

//#region Create
export const createCommunicationSchema = z.object({
  title: z.string().min(3).max(150),
  content: z.string().min(1).max(10000),
  type: z.enum(["GENERAL", "INFO", "WARNING", "URGENT"]),
  recipientMode: z.enum(["ALL_USERS", "USERS", "CATEGORIES"]).default("ALL_USERS"),
  recipientUserIds: z.array(z.coerce.number().int().positive()).default([]),
  recipientCategoryIds: z.array(z.coerce.number().int().positive()).default([]),
  recipientWithoutCategory: z.boolean().default(false),
  recipientExtraUserIds: z.array(z.coerce.number().int().positive()).default([]),
  recipientExcludedUserIds: z.array(z.coerce.number().int().positive()).default([]),
}).strict();
export type CreateCommunicationInput = CreateCommunicationDto;
//#endregion

//#region Get
// Get communicationId
export const getCommunicationIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
// Get inbox communications
export const getInboxSchema = z.object({
  read: readQueryValue,
}).strict();
//#endregion

//#region Delete
// Delete inbox communications
export const deleteInboxSchema = z.object({
  communicationIds: z.array(z.coerce.number().int().positive()).min(1),
}).strict();
export type DeleteInboxCommunicationsInput = DeleteInboxCommunicationsDto;
//#endregion
