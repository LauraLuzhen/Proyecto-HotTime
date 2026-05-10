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

  categoryId?: number;

  published?: boolean;

  status?: ShiftStatus;

  startsFrom?: Date;
  startsTo?: Date;

  endsFrom?: Date;
  endsTo?: Date;

  limit?: number;
  offset?: number;
}

/* =========================
   RESPONSE
========================= */

export interface GetShiftResponseDto {
  shift: ShiftEntity;
}

export interface GetShiftsResponseDto {
  shifts: ShiftEntity[];
  total: number;
}