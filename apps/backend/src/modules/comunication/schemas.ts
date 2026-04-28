import { z } from "zod";

export const createCommunicationSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum([
    "GENERAL",
    "REQUEST_DAYS",
    "VACATION",
    "ABSENCE",
    "TEMP_LEAVE",
    "PERM_LEAVE",
    "STAFF_SHORTAGE",
  ]),
  recipientIds: z.array(z.number()).min(1),
});

export const communicationIdSchema = z.object({
  id: z.string().transform((val) => Number(val)),
});