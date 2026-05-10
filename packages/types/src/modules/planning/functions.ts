// functions.ts

import type {
  CreateShiftForCategoryDto,
  CreateShiftForUserDto,
  CreateShiftForUsersDto,
  CreateShiftResponseDto,
  GetShiftsDto,
  GetShiftResponseDto,
  GetShiftsResponseDto,
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

/* =========================
   GET
========================= */

export type GetShiftsFn = (
  filters: GetShiftsDto,
  organizationId: number
) => Promise<GetShiftsResponseDto>;

export type GetShiftFn = (
  shiftId: number,
  organizationId: number
) => Promise<GetShiftResponseDto | null>;