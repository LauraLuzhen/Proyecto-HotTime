// dtos.ts

import type { ShiftEntity } from "./entities";
import type { ShiftStatus } from "../../shared/common";


/* =========================
   CREATE
========================= */

export interface CreateShiftForUserDto {
  startsAt: Date;
  endsAt: Date;
  published?: boolean;
  userId: number;
}

export interface CreateShiftForUsersDto {
  startsAt: Date;
  endsAt: Date;
  published?: boolean;
  userIds: number[];
}

export interface CreateShiftForCategoryDto {
  startsAt: Date;
  endsAt: Date;
  published?: boolean;

  /**
   * Users de esta category
   * null => users sin categories
   */
  categoryId: number | null;
}

export interface CreateShiftDto {
  userId: number;
  categoryId: number | null;
  startsAt: Date;
  endsAt: Date;
  published?: boolean;
}

export interface CreateManyShiftsDto {
  userIds: number[];
  categoryId: number | null;
  startsAt: Date;
  endsAt: Date;
  published?: boolean;
}

/* =========================
   RESPONSE
========================= */

export interface CreateShiftResponseDto {
  shifts: ShiftEntity[];
  total: number;
}

/* =========================
   GET SHIFTS (FILTERS)
========================= */

export interface GetShiftsDto {
  shiftId?: number;

  userId?: number;
  userIds?: number[];

  categoryId?: number | null;

  published?: boolean;

  status?: ShiftStatus;

  startsFrom?: Date;
  startsTo?: Date;

  endsFrom?: Date;
  endsTo?: Date;

  limit?: number;
  offset?: number;
}

export interface PlanningRangeQueryDto extends GetShiftsDto {
  from?: Date;
  to?: Date;
}

/* =========================
   RESPONSE
========================= */

export interface GetShiftResponseDto {
  shift: ShiftEntity;
}

export type ShiftResponse = ShiftEntity;

export interface GetShiftsResponseDto {
  shifts: ShiftEntity[];
  total: number;
}

/* =========================
   CALENDAR SHIFTS
========================= */

export interface GetCalendarShiftsDto {
  userId?: number;

  date?: Date; // referencia (hoy si no viene)

  includeNext?: boolean;
  includeWeek?: boolean;
  includeMonth?: boolean;
}

export interface GetCalendarShiftsResponseDto {
  next: ShiftEntity | null;
  week: ShiftEntity[];
  month: ShiftEntity[];
}

/* =========================
   UPDATE SHIFT
========================= */

export interface UpdateShiftDto {
  shiftId: number;

  startsAt?: Date;
  endsAt?: Date;

  status?: ShiftStatus;

  published?: boolean;
}
export interface UpdateShiftResponseDto {
  shift: ShiftEntity;
}

export interface DeleteShiftResponse {
  success: boolean;
}
