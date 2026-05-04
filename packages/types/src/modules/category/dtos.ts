// CREATE
export interface CreateCategoryDto {
  name: string;
}

// GET
export interface CategoriesResponse {
  id: number;
  name: string;
  organizationId: number;
}
export interface GetUsersByCategoryDto {
  categoryId: number;
}

// UPDATE
export interface UpdateCategoryDto {
  name?: string;
}

// DELETE
export interface DeleteCategoryResponse {
  success: boolean;
}
