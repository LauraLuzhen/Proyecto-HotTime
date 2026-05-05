import type {
  LoginDto,
  LogInResponse,
  ForgotPasswordDto,
  ForgotPasswordResponse,
  ResetPasswordDto,
  SuccessResponse,
  CategoriesResponse,
  CreateCategoryDto,
  GeneralUserResponse,
  UpdateCategoryDto,
  DeleteCategoryResponse,
  CreateUserDto,
  GetUsersQueryDto,
  UpdateMeDto,
  UpdateUsersDto,
  CreateUserResponse,
  DeleteUserResponse,
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
type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

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

  patch<TResponse, TBody = unknown>(path: string, body?: TBody): Promise<TResponse> {
    return this.request<TResponse>({ method: "PATCH", path, body });
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

function buildUserQuery(filters: GetUsersQueryDto): string {
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
      login: (data: LoginDto) => http.post<LogInResponse, LoginDto>("/auth/login", data),
      forgotPassword: (data: ForgotPasswordDto) => http.post<ForgotPasswordResponse, ForgotPasswordDto>("/auth/forgot-password", data),
      resetPassword: (data: ResetPasswordDto) => http.post<SuccessResponse, ResetPasswordDto>("/auth/reset-password", data),
    },
    user: {
      getUsers: (organizationId: number, filters: GetUsersQueryDto, userId: number) => http.get<GeneralUserResponse[]>(`/users${buildUserQuery(filters)}`),
      getMe: (userId?: number) => http.get<GeneralUserResponse>("/users/me"),
      createUser: (data: CreateUserDto, organizationId: number) => http.post<CreateUserResponse, CreateUserDto>("/users", data),
      updateMe: (userId: number, data: UpdateMeDto) => http.patch<GeneralUserResponse, UpdateMeDto>("/users/me", data),
      updateUsers: (userId: number, adminOrganizationId: number, currentUserId: number, data: UpdateUsersDto) => http.patch<GeneralUserResponse, UpdateUsersDto>(`/users/${userId}`, data),
      deleteUser: (userId: number, organizationId: number, currentUserId: number) => http.delete<DeleteUserResponse>(`/users/${userId}`),
    },
    category: {
      getCategories: (organizationId: number) => http.get<CategoriesResponse[]>("/categories"),
      getUsersByCategory: (categoryId: number, organizationId: number) => http.get<GeneralUserResponse[]>(`/categories/${categoryId}/users`),
      createCategory: (data: CreateCategoryDto, organizationId: number) => http.post<CategoriesResponse, CreateCategoryDto>("/categories", data),
      updateCategory: (categoryId: number, organizationId: number, data: UpdateCategoryDto) => http.patch<CategoriesResponse, UpdateCategoryDto>(`/categories/${categoryId}`, data),
      deleteCategory: (categoryId: number, organizationId: number) => http.delete<DeleteCategoryResponse>(`/categories/${categoryId}`),
    },
  };
}
