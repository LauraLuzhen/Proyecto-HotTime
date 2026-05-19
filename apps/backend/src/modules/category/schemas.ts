import { z } from "zod";
import { CreateCategoryDto, UpdateCategoryDto } from "@hottime/types";

//#region Create
export const createCategorySchema = z.object({
  name: z.string().min(3).max(50),
}).strict();
export type CreateCategoryInput = CreateCategoryDto;
//#endregion

//#region Get
export const getUsersByCategorySchema = z.object({
  categoryId: z.coerce.number(),
});
//#endregion

//#region Update
export const updateCategoryParamsSchema = z.object({
  id: z.coerce.number(),
});
export const updateCategorySchema = z.object({
  name: z.string().min(3).max(50).optional(),
}).strict();
export type UpdateCategoryInput = UpdateCategoryDto
//#endregion

//#region Delete
export const deleteCategorySchema = z.object({
  id: z.coerce.number(),
});
//#endregion
