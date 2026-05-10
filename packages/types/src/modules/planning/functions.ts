// functions.ts

import type {
  CreateShiftForCategoryDto,
  CreateShiftForUserDto,
  CreateShiftForUsersDto,
  CreateShiftResponseDto,
} from "./dtos";


/* =========================
   CREATE
========================= */

export type CreateShiftForUserFn = (
  data: CreateShiftForUserDto,
  organizationId: number,
  createdById: number
) => Promise<CreateShiftResponseDto>;

export type CreateShiftForUsersFn = (
  data: CreateShiftForUsersDto,
  organizationId: number,
  createdById: number
) => Promise<CreateShiftResponseDto>;

export type CreateShiftForCategoryFn = (
  data: CreateShiftForCategoryDto,
  organizationId: number,
  createdById: number
) => Promise<CreateShiftResponseDto>;
