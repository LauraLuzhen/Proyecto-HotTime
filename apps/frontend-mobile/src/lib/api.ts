import type {
  AdminCreateUserDto,
  CategoryEntity,
  ChangePasswordDto,
  CreateCategoryDto,
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  LoginDto,
  LoginResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
  UpdateCategoryDto,
  UpdateMeDto,
  UserEntity,
  UserFiltersDto,
} from "@hottime/types";

export interface ApiErrorResponse {
  message?: string;
  code?: string;
  statusCode?: number;
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly payload: unknown;

  constructor(message: string, status: number, code?: string, payload?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>;
type Method = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  method: Method;
  path: string;
  body?: unknown;
}

class BackendHttpClient {
  private readonly baseUrl: string;
  private readonly getToken: TokenProvider;

  constructor(baseUrl: string, getToken: TokenProvider) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.getToken = getToken;
  }

  get<TResponse>(path: string): Promise<TResponse> {
    return this.request<TResponse>({ method: "GET", path });
  }

  post<TResponse, TBody = unknown>(path: string, body?: TBody): Promise<TResponse> {
    return this.request<TResponse>({ method: "POST", path, body });
  }

  put<TResponse, TBody = unknown>(path: string, body?: TBody): Promise<TResponse> {
    return this.request<TResponse>({ method: "PUT", path, body });
  }

  delete<TResponse>(path: string): Promise<TResponse> {
    return this.request<TResponse>({ method: "DELETE", path });
  }

  private async request<TResponse>(options: RequestOptions): Promise<TResponse> {
    const token = await this.getToken();
    const hasBody = options.body !== undefined;
    const headers: Record<string, string> = {};

    if (token) headers.authorization = `Bearer ${token}`;
    if (hasBody) headers["content-type"] = "application/json";

    const response = await fetch(`${this.baseUrl}${options.path}`, {
      method: options.method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload: unknown = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const errorPayload = (payload as ApiErrorResponse) ?? {};
      throw new ApiClientError(
        errorPayload.message ?? `HTTP error ${response.status}`,
        response.status,
        errorPayload.code,
        payload
      );
    }

    return payload as TResponse;
  }
}

function buildUserQuery(filters?: UserFiltersDto): string {
  if (!filters) return "";

  const params = new URLSearchParams();
  if (filters.fullName) params.set("fullName", filters.fullName);
  if (filters.role) params.set("role", filters.role);
  if (filters.categoryId !== undefined) params.set("categoryId", String(filters.categoryId));

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function createApi(getToken: () => string | null | Promise<string | null>) {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://192.168.1.129:3001";
  const http = new BackendHttpClient(apiBaseUrl, getToken);

  return {
    auth: {
      login: (data: LoginDto) => http.post<LoginResponseDto, LoginDto>("/auth/login", data),
      forgotPassword: (data: ForgotPasswordDto) =>
        http.post<ForgotPasswordResponseDto, ForgotPasswordDto>("/auth/forgot-password", data),
      resetPassword: (data: ResetPasswordDto) =>
        http.post<ResetPasswordResponseDto, ResetPasswordDto>("/auth/reset-password", data),
    },
    user: {
      getUsers: (filters?: UserFiltersDto) =>
        http.get<(UserEntity & { category?: unknown; organization?: unknown })[]>(`/users${buildUserQuery(filters)}`),
      getMe: () => http.get<Omit<UserEntity, "password" | "resetToken" | "resetTokenExp">>("/users/me"),
      createUser: (data: AdminCreateUserDto) => http.post<UserEntity, AdminCreateUserDto>("/users", data),
      updateMe: (data: UpdateMeDto) => http.put<UserEntity, UpdateMeDto>("/users/me", data),
      changeMyPassword: (data: ChangePasswordDto) =>
        http.put<UserEntity, ChangePasswordDto>("/users/me/password", data),
      deleteUser: (userId: number) => http.delete<UserEntity>(`/users/${userId}`),
    },
    category: {
      getCategories: () => http.get<CategoryEntity[]>("/categories"),
      getUsersByCategory: (categoryId: number) => http.get<UserEntity[]>(`/categories/${categoryId}/users`),
      createCategory: (data: CreateCategoryDto) => http.post<CategoryEntity, CreateCategoryDto>("/categories", data),
      updateCategory: (categoryId: number, data: UpdateCategoryDto) =>
        http.put<CategoryEntity, UpdateCategoryDto>(`/categories/${categoryId}`, data),
      deleteCategory: (categoryId: number) => http.delete<CategoryEntity>(`/categories/${categoryId}`),
    },
  };
}

