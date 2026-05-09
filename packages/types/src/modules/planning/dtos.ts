import type { AttendanceType, ShiftStatus } from "../../shared/common";

export interface PlanningUserResponse {
  id: number;
  fullName: string;
  email: string;
}

export interface PlanningCategoryResponse {
  id: number;
  name: string;
}

export interface AttendanceResponse {
  id: number;
  organizationId: number;
  shiftId: number;
  userId: number;
  type: AttendanceType;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  occurredAt: Date;
  createdAt: Date;
}

export interface ShiftResponse {
  id: number;
  organizationId: number;
  userId: number;
  createdById: number;
  categoryId: number | null;
  startsAt: Date;
  endsAt: Date;
  actualStartsAt: Date | null;
  actualEndsAt: Date | null;
  status: ShiftStatus;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: PlanningUserResponse;
  createdBy: PlanningUserResponse;
  category: PlanningCategoryResponse | null;
  attendances: AttendanceResponse[];
}

export interface CreateShiftDto {
  userId: number;
  categoryId?: number | null;
  startsAt: Date;
  endsAt: Date;
  published?: boolean;
}

export interface CreateManyShiftsDto {
  userIds?: number[];
  allUsers?: boolean;
  categoryId?: number | null;
  startsAt: Date;
  endsAt: Date;
  published?: boolean;
}

export interface UpdateShiftDto {
  userId?: number;
  categoryId?: number | null;
  startsAt?: Date;
  endsAt?: Date;
  actualStartsAt?: Date | null;
  actualEndsAt?: Date | null;
  status?: ShiftStatus;
  published?: boolean;
}

export interface PlanningRangeQueryDto {
  from?: Date;
  to?: Date;
  userId?: number;
  userIds?: number[];
  categoryId?: number | null;
  status?: ShiftStatus;
  published?: boolean;
}

export interface PlanningUserQueryDto {
  userId?: number;
}

export interface ClockDto {
  shiftId: number;
  latitude: number;
  longitude: number;
  occurredAt?: Date;
}

export interface AttendanceQueryDto {
  from?: Date;
  to?: Date;
  userId?: number;
  userIds?: number[];
  shiftId?: number;
  type?: AttendanceType;
}

export interface DeleteShiftResponse {
  success: boolean;
}
