export interface CreateCategoryDto {
  name: string;
}

export interface CategoriesResponse {
  id: number;
  name: string;
  organizationId: number;
}
export interface GetUsersByCategoryDto {
  categoryId: number;
}

export interface UpdateCategoryDto {
  name?: string;
}

export interface DeleteCategoryResponse {
  success: boolean;
}
