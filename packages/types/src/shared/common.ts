export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

export interface AuthenticatedUser {
  id: number;
  role: Role;
  organizationId: number;
}

export interface ApiErrorPayload {
  message: string;
  code: string;
  statusCode: number;
}

export type CommunicationType = "GENERAL" | "REQUEST_DAYS" | "VACATION" | "ABSENCE" | "TEMP_LEAVE" | "PERM_LEAVE" | "STAFF_SHORTAGE";