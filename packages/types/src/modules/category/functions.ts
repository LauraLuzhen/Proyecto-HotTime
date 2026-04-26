import type { CategoryEntity } from "./entities";
import type { UserEntity } from "../user/entities";

export type GetCategoriesFn = (organizationId: number) => Promise<CategoryEntity[]>;
export type GetUsersFromCategoryFn = (
  categoryId: number,
  organizationId: number
) => Promise<UserEntity[]>;
export type CreateCategoryFn = (name: string, organizationId: number) => Promise<CategoryEntity>;
export type UpdateCategoryFn = (
  id: number,
  name: string,
  organizationId: number
) => Promise<CategoryEntity>;
export type DeleteCategoryFn = (id: number, organizationId: number) => Promise<CategoryEntity>;
