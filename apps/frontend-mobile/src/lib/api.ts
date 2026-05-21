import type {
  LoginDto,
  LogInResponse,
  ForgotPasswordDto,
  ResetPasswordDto,
  SuccessResponse,
  CategoriesResponse,
  CreateCategoryDto,
  GeneralUserResponse,
  MeResponse,
  UpdateCategoryDto,
  DeleteCategoryResponse,
  CreateUserDto,
  GetUsersQueryDto,
  UpdateMeDto,
  UpdateUsersDto,
  CreateUserResponse,
  DeleteUserResponse,
  CommunicationCountResponse,
  CommunicationDeleteResponse,
  CommunicationDetailResponse,
  CommunicationInboxQueryDto,
  CommunicationInboxResponse,
  CommunicationOutboxResponse,
  CreateCommunicationDto,
  DeleteInboxCommunicationsDto,
  ClockDto,
  AttendanceResponse,
  CreateAttendanceDto,
  CreateAttendanceResponse,
  DeleteAttendanceResponse,
  OrganizationResponse,
  CreateManyShiftsDto,
  CreateShiftDto,
  CreateShiftForCategoryDto,
  CreateShiftForUserDto,
  CreateShiftForUsersDto,
  DeleteShiftResponse,
  GetAttendanceCalendarDto,
  GetAttendanceResponse,
  GetAttendancesDto,
  GetAttendancesResponse,
  PlanningRangeQueryDto,
  GetShiftsResponseDto,
  ShiftResponse,
  GetShiftResponseDto,
  UpdateShiftDto,
  UpdateAttendanceDto,
  UpdateAttendanceResponse,
  UpdateOrganizationDto,
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

function buildUserQuery(filters?: GetUsersQueryDto): string {
  if (!filters) return "";

  const params = new URLSearchParams();
  if (filters.fullName) params.set("fullName", filters.fullName);
  if (filters.role) params.set("role", filters.role);
  if (filters.categoryId !== undefined) params.set("categoryId", String(filters.categoryId));

  const query = params.toString();
  return query ? `?${query}` : "";
}

function buildInboxQuery(filters?: CommunicationInboxQueryDto): string {
  if (!filters) return "";

  const params = new URLSearchParams();
  if (filters.read !== undefined) params.set("read", String(filters.read));

  const query = params.toString();
  return query ? `?${query}` : "";
}

function buildPlanningRangeQuery(filters?: PlanningRangeQueryDto): string {
  if (!filters) return "";

  const params = new URLSearchParams();
  if (filters.shiftId !== undefined) params.set("shiftId", String(filters.shiftId));
  if (filters.userId !== undefined) params.set("userId", String(filters.userId));
  if (filters.userIds?.length) params.set("userIds", filters.userIds.join(","));
  if (filters.categoryId !== undefined) params.set("categoryId", filters.categoryId === null ? "none" : String(filters.categoryId));
  if (filters.published !== undefined) params.set("published", String(filters.published));
  if (filters.status) params.set("status", filters.status);
  if (filters.startsFrom) params.set("startsFrom", new Date(filters.startsFrom).toISOString());
  if (filters.startsTo) params.set("startsTo", new Date(filters.startsTo).toISOString());
  if (filters.endsFrom) params.set("endsFrom", new Date(filters.endsFrom).toISOString());
  if (filters.endsTo) params.set("endsTo", new Date(filters.endsTo).toISOString());
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined) params.set("offset", String(filters.offset));

  const query = params.toString();
  return query ? `?${query}` : "";
}

function buildDateQuery(filters?: { userId?: number; date?: Date; includeWeek?: boolean; includeMonth?: boolean; includeNext?: boolean }): string {
  if (!filters) return "";

  const params = new URLSearchParams();
  if (filters.userId !== undefined) params.set("userId", String(filters.userId));
  if (filters.date) params.set("date", new Date(filters.date).toISOString());
  if (filters.includeWeek !== undefined) params.set("includeWeek", String(filters.includeWeek));
  if (filters.includeMonth !== undefined) params.set("includeMonth", String(filters.includeMonth));
  if (filters.includeNext !== undefined) params.set("includeNext", String(filters.includeNext));

  const query = params.toString();
  return query ? `?${query}` : "";
}

function buildAttendanceQuery(filters?: GetAttendancesDto): string {
  if (!filters) return "";

  const params = new URLSearchParams();
  if (filters.attendanceId !== undefined) params.set("attendanceId", String(filters.attendanceId));
  if (filters.userId !== undefined) params.set("userId", String(filters.userId));
  if (filters.shiftId !== undefined) params.set("shiftId", String(filters.shiftId));
  if (filters.type !== undefined) params.set("type", filters.type);
  if (filters.from) params.set("from", new Date(filters.from).toISOString());
  if (filters.to) params.set("to", new Date(filters.to).toISOString());
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined) params.set("offset", String(filters.offset));

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function createApi(getToken: () => string | null | Promise<string | null>) {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://192.168.1.129:3001";
  const http = new BackendHttpClient(apiBaseUrl, getToken);

  return {
    auth: {
      login: (data: LoginDto) => http.post<LogInResponse, LoginDto>("/auth/login", data),
      forgotPassword: (data: ForgotPasswordDto) => http.post<SuccessResponse, ForgotPasswordDto>("/auth/forgot-password", data),
      resetPassword: (data: ResetPasswordDto) => http.post<SuccessResponse, ResetPasswordDto>("/auth/reset-password", data),
    },
    user: {
      getUsers: (filters?: GetUsersQueryDto) => http.get<GeneralUserResponse[]>(`/users${buildUserQuery(filters)}`),
      getUsersAll: (filters?: GetUsersQueryDto) => http.get<GeneralUserResponse[]>(`/users/all${buildUserQuery(filters)}`),
      getMe: () => http.get<MeResponse>("/users/me"),
      createUser: (data: CreateUserDto) => http.post<CreateUserResponse, CreateUserDto>("/users", data),
      updateMe: (data: UpdateMeDto) => http.patch<GeneralUserResponse, UpdateMeDto>("/users/me", data),
      updateUsers: (userId: number, data: UpdateUsersDto) => http.patch<GeneralUserResponse, UpdateUsersDto>(`/users/${userId}`, data),
      deleteUser: (userId: number) => http.delete<DeleteUserResponse>(`/users/${userId}`),
    },
    category: {
      getCategories: () => http.get<CategoriesResponse[]>("/categories"),
      getUsersByCategory: (categoryId: number, organizationId: number) => http.get<GeneralUserResponse[]>(`/categories/${categoryId}/users`),
      createCategory: (data: CreateCategoryDto) => http.post<CategoriesResponse, CreateCategoryDto>("/categories", data),
      updateCategory: (categoryId: number, data: UpdateCategoryDto) => http.patch<CategoriesResponse, UpdateCategoryDto>(`/categories/${categoryId}`, data),
      deleteCategory: (categoryId: number) => http.delete<DeleteCategoryResponse>(`/categories/${categoryId}`),
    },
    communication: {
      createCommunication: (data: CreateCommunicationDto) => http.post<CommunicationOutboxResponse, CreateCommunicationDto>("/communications", data),
      getInbox: (filters?: CommunicationInboxQueryDto) => http.get<CommunicationInboxResponse[]>(`/communications/inbox${buildInboxQuery(filters)}`),
      getById: (communicationId: number) => http.get<CommunicationDetailResponse>(`/communications/${communicationId}`),
      countRead: () => http.get<CommunicationCountResponse>("/communications/inbox/count/read"),
      countUnread: () => http.get<CommunicationCountResponse>("/communications/inbox/count/unread"),
      hideInbox: (data: DeleteInboxCommunicationsDto) => http.post<CommunicationDeleteResponse, DeleteInboxCommunicationsDto>("/communications/inbox/hide", data),
      delete: (data: DeleteInboxCommunicationsDto) => http.post<CommunicationDeleteResponse, DeleteInboxCommunicationsDto>("/communications/delete", data),
    },
    organization: {
      get: () => http.get<OrganizationResponse>("/organization"),
      update: (data: UpdateOrganizationDto) => http.patch<OrganizationResponse, UpdateOrganizationDto>("/organization", data),
    },
    planning: {
      getShifts: (filters?: PlanningRangeQueryDto) => http.get<GetShiftsResponseDto>(`/planning/shifts${buildPlanningRangeQuery(filters)}`),
      getShiftById: (shiftId: number) => http.get<GetShiftResponseDto>(`/planning/shifts/${shiftId}`),
      getCalendar: (filters?: { userId?: number; date?: Date; includeWeek?: boolean; includeMonth?: boolean; includeNext?: boolean }) =>
        http.get<{ next: ShiftResponse | null; week: ShiftResponse[]; month: ShiftResponse[] }>(`/planning/shifts/calendar${buildDateQuery(filters)}`),
      createShiftForUser: (data: CreateShiftForUserDto) => http.post<{ shifts: ShiftResponse[]; total: number }, CreateShiftForUserDto>("/planning/shifts/user", data),
      createShiftForUsers: (data: CreateShiftForUsersDto) => http.post<{ shifts: ShiftResponse[]; total: number }, CreateShiftForUsersDto>("/planning/shifts/users", data),
      createShiftForCategory: (data: CreateShiftForCategoryDto) => http.post<{ shifts: ShiftResponse[]; total: number }, CreateShiftForCategoryDto>("/planning/shifts/category", data),
      createShift: (data: CreateShiftDto) => http.post<{ shifts: ShiftResponse[]; total: number }, CreateShiftDto>("/planning/shifts/user", data),
      createManyShifts: (data: CreateManyShiftsDto) => http.post<{ shifts: ShiftResponse[]; total: number }, CreateManyShiftsDto>("/planning/shifts/users", data),
      updateShift: (shiftId: number, data: Omit<UpdateShiftDto, "shiftId">) => http.patch<{ shift: ShiftResponse }, Omit<UpdateShiftDto, "shiftId">>(`/planning/shifts/${shiftId}`, data),
      deleteShift: (shiftId: number) => http.delete<DeleteShiftResponse>(`/planning/shifts/${shiftId}`),
      clockIn: (data: ClockDto) => http.post<AttendanceResponse, ClockDto>("/planning/attendance/clock-in", data),
      clockOut: (data: ClockDto) => http.post<AttendanceResponse, ClockDto>("/planning/attendance/clock-out", data),
    },
    attendance: {
      create: (data: CreateAttendanceDto) => http.post<CreateAttendanceResponse, CreateAttendanceDto>("/planning/attendance", data),
      getById: (attendanceId: number) => http.get<GetAttendanceResponse>(`/planning/attendance/${attendanceId}`),
      getAttendances: (filters?: GetAttendancesDto) => http.get<GetAttendancesResponse>(`/planning/attendance${buildAttendanceQuery(filters)}`),
      getCalendar: (filters?: GetAttendanceCalendarDto) => http.get<{ week: AttendanceResponse[]; month: AttendanceResponse[] }>(`/planning/attendance/calendar${buildDateQuery(filters)}`),
      getWeek: (filters?: GetAttendanceCalendarDto) => http.get<{ week: AttendanceResponse[] }>(`/planning/attendance/week${buildDateQuery(filters)}`),
      getMonth: (filters?: GetAttendanceCalendarDto) => http.get<{ month: AttendanceResponse[] }>(`/planning/attendance/month${buildDateQuery(filters)}`),
      update: (attendanceId: number, data: UpdateAttendanceDto) => http.patch<UpdateAttendanceResponse, UpdateAttendanceDto>(`/planning/attendance/${attendanceId}`, data),
      delete: (attendanceId: number) => http.delete<DeleteAttendanceResponse>(`/planning/attendance/${attendanceId}`),
      clockIn: (data: ClockDto) => http.post<AttendanceResponse, ClockDto>("/planning/attendance/clock-in", data),
      clockOut: (data: ClockDto) => http.post<AttendanceResponse, ClockDto>("/planning/attendance/clock-out", data),
    },
  };
}
