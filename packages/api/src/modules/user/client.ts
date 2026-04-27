import { HttpClient } from "../../core/httpClient";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CreateUserRequest,
  CreateUserResponse,
  DeleteUserResponse,
  GetMeResponse,
  GetUsersQuery,
  GetUsersResponse,
  UpdateMeRequest,
  UpdateMeResponse,
} from "./contracts";

function buildQuery(filters?: GetUsersQuery): string {
  if (!filters) return "";

  const params = new URLSearchParams();

  if (filters.fullName) params.set("fullName", filters.fullName);
  if (filters.role) params.set("role", filters.role);
  if (filters.categoryId !== undefined) params.set("categoryId", String(filters.categoryId));

  const query = params.toString();
  return query ? `?${query}` : "";
}

export class UserApi {
  constructor(private readonly http: HttpClient) {}

  getUsers(filters?: GetUsersQuery): Promise<GetUsersResponse> {
    return this.http.get<GetUsersResponse>(`/users${buildQuery(filters)}`);
  }

  getMe(): Promise<GetMeResponse> {
    return this.http.get<GetMeResponse>("/users/me");
  }

  createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
    return this.http.post<CreateUserResponse, CreateUserRequest>("/users", data);
  }

  updateMe(data: UpdateMeRequest): Promise<UpdateMeResponse> {
    return this.http.put<UpdateMeResponse, UpdateMeRequest>("/users/me", data);
  }

  changeMyPassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    return this.http.put<ChangePasswordResponse, ChangePasswordRequest>("/users/me/password", data);
  }

  deleteUser(userId: number): Promise<DeleteUserResponse> {
    return this.http.delete<DeleteUserResponse>(`/users/${userId}`);
  }
}
