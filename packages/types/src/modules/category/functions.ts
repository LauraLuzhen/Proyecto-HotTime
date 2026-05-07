import type { CategoriesResponse, CreateCategoryDto, UpdateCategoryDto, DeleteCategoryResponse } from "./dtos";
import type { GeneralUserResponse } from "../user/dtos";

export type CreateCategoryFn = (data: CreateCategoryDto, organizationId: number) => Promise<CategoriesResponse>;
export type GetCategoriesFn = (organizationId: number) => Promise<CategoriesResponse[]>;
export type GetUsersByCategoryFn = (categoryId: number, organizationId: number) => Promise<GeneralUserResponse[]>;
export type UpdateCategoryFn = (categoryId: number, organizationId: number, data: UpdateCategoryDto) => Promise<CategoriesResponse>;
export type DeleteCategoryFn = (categoryId: number, organizationId: number) => Promise<DeleteCategoryResponse>;
