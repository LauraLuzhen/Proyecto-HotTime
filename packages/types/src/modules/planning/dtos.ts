// dtos.ts

import type { ShiftEntity } from "./entities";

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
