import type {
  CreateShiftForCategoryDto,
  CreateShiftForUserDto,
  CreateShiftForUsersDto,
  CreateShiftResponseDto,
  GetShiftsDto,
  GetShiftResponseDto,
  GetShiftsResponseDto,
    GetCalendarShiftsDto,
  GetCalendarShiftsResponseDto,
    UpdateShiftDto,
  UpdateShiftResponseDto,
  DeleteShiftResponse,
} from "./dtos";

export type CreateShiftForUserFn = (data: CreateShiftForUserDto, organizationId: number, createdById: number) => Promise<CreateShiftResponseDto>;
export type CreateShiftForUsersFn = (data: CreateShiftForUsersDto, organizationId: number, createdById: number) => Promise<CreateShiftResponseDto>;
export type CreateShiftForCategoryFn = (data: CreateShiftForCategoryDto, organizationId: number, createdById: number) => Promise<CreateShiftResponseDto>;
export type GetShiftsFn = (filters: GetShiftsDto, organizationId: number) => Promise<GetShiftsResponseDto>;
export type GetShiftFn = (shiftId: number, organizationId: number) => Promise<GetShiftResponseDto | null>;
export type GetCalendarShiftsFn = (data: GetCalendarShiftsDto, organizationId: number) => Promise<GetCalendarShiftsResponseDto>;
export type UpdateShiftFn = (data: UpdateShiftDto, organizationId: number, actorUserId: number) => Promise<UpdateShiftResponseDto>;
export type DeleteShiftFn = (shiftId: number, organizationId: number, actorUserId: number) => Promise<DeleteShiftResponse>;
