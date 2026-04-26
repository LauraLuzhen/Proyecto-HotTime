import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const categoryIdSchema = z.object({
  id: z.string().transform((val) => Number(val)),
});

export const usersByCategorySchema = z.object({
  id: z.string().transform((val) => Number(val)),
});