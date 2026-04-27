import type { CategoryEntity, CreateCategoryDto, UpdateCategoryDto, UserEntity } from "@hottime/types";

export type GetCategoriesResponse = CategoryEntity[];

export type GetUsersByCategoryResponse = UserEntity[];

export type CreateCategoryRequest = CreateCategoryDto;
export type CreateCategoryResponse = CategoryEntity;

export type UpdateCategoryRequest = UpdateCategoryDto;
export type UpdateCategoryResponse = CategoryEntity;

export type DeleteCategoryResponse = CategoryEntity;
