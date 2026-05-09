import type {
  AttendanceQueryDto,
  AttendanceResponse,
  ClockDto,
  CreateManyShiftsDto,
  CreateShiftDto,
  DeleteShiftResponse,
  PlanningRangeQueryDto,
  PlanningUserQueryDto,
  ShiftResponse,
  UpdateShiftDto,
} from "./dtos";
import type { Role } from "../../shared/common";

export type CreateShiftFn = (data: CreateShiftDto, actorId: number, organizationId: number) => Promise<ShiftResponse>;
export type CreateManyShiftsFn = (data: CreateManyShiftsDto, actorId: number, organizationId: number) => Promise<ShiftResponse[]>;
export type GetShiftsFn = (filters: PlanningRangeQueryDto, actorId: number, actorRole: Role, organizationId: number) => Promise<ShiftResponse[]>;
export type GetShiftByIdFn = (shiftId: number, actorId: number, actorRole: Role, organizationId: number) => Promise<ShiftResponse>;
export type GetNextShiftFn = (filters: PlanningUserQueryDto, actorId: number, actorRole: Role, organizationId: number) => Promise<ShiftResponse | null>;
export type GetWeekShiftsFn = (filters: PlanningUserQueryDto, actorId: number, actorRole: Role, organizationId: number, now?: Date) => Promise<ShiftResponse[]>;
export type GetMonthShiftsFn = (filters: PlanningUserQueryDto, actorId: number, actorRole: Role, organizationId: number, now?: Date) => Promise<ShiftResponse[]>;
export type UpdateShiftFn = (shiftId: number, data: UpdateShiftDto, actorId: number, organizationId: number) => Promise<ShiftResponse>;
export type DeleteShiftFn = (shiftId: number, actorId: number, organizationId: number) => Promise<DeleteShiftResponse>;
export type ClockInFn = (data: ClockDto, actorId: number, organizationId: number) => Promise<AttendanceResponse>;
export type ClockOutFn = (data: ClockDto, actorId: number, organizationId: number) => Promise<AttendanceResponse>;
export type GetAttendanceFn = (filters: AttendanceQueryDto, actorId: number, actorRole: Role, organizationId: number) => Promise<AttendanceResponse[]>;
export type GetWeekAttendanceFn = (filters: PlanningUserQueryDto, actorId: number, actorRole: Role, organizationId: number, now?: Date) => Promise<AttendanceResponse[]>;
export type GetMonthAttendanceFn = (filters: PlanningUserQueryDto, actorId: number, actorRole: Role, organizationId: number, now?: Date) => Promise<AttendanceResponse[]>;
