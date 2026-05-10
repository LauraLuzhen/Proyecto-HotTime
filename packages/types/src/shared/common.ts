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
export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";
export type CommunicationType = "GENERAL" | "INFO" | "WARNING" | "URGENT";
export type ShiftStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "MISSED";
export type AttendanceType = "CLOCK_IN" | "CLOCK_OUT";
