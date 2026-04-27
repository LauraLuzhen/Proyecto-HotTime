import { HttpClient } from "../../core/httpClient";
import type {
  CreateCategoryRequest,
  CreateCategoryResponse,
  DeleteCategoryResponse,
  GetCategoriesResponse,
  GetUsersByCategoryResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
} from "./contracts";

export class CategoryApi {
  constructor(private readonly http: HttpClient) {}

  getCategories(): Promise<GetCategoriesResponse> {
    return this.http.get<GetCategoriesResponse>("/categories");
  }

  getUsersByCategory(categoryId: number): Promise<GetUsersByCategoryResponse> {
    return this.http.get<GetUsersByCategoryResponse>(`/categories/${categoryId}/users`);
  }

  createCategory(data: CreateCategoryRequest): Promise<CreateCategoryResponse> {
    return this.http.post<CreateCategoryResponse, CreateCategoryRequest>("/categories", data);
  }

  updateCategory(categoryId: number, data: UpdateCategoryRequest): Promise<UpdateCategoryResponse> {
    return this.http.put<UpdateCategoryResponse, UpdateCategoryRequest>(`/categories/${categoryId}`, data);
  }

  deleteCategory(categoryId: number): Promise<DeleteCategoryResponse> {
    return this.http.delete<DeleteCategoryResponse>(`/categories/${categoryId}`);
  }
}
