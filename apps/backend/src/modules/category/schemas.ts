import { z } from "zod";
import { CreateCategoryDto, UpdateCategoryDto } from "@hottime/types";

// CREATE
export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
}).strict();
export type CreateCategoryInput = CreateCategoryDto;

// GET
export const getUsersByCategorySchema = z.object({
  categoryId: z.coerce.number(),
});

// UPDATE
export const updateCategoryParamsSchema = z.object({
  id: z.coerce.number(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
}).strict();
export type UpdateCategoryInput = UpdateCategoryDto

// DELETE
export const deleteCategorySchema = z.object({
  id: z.coerce.number(),
});
