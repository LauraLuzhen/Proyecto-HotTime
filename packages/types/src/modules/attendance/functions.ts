import type {
  ClockInDto,
  AttendanceClockResponse,
  ClockOutDto,
  CreateAttendanceDto,
  CreateAttendanceResponse,
  DeleteAttendanceResponse,
  GetAttendanceCalendarDto,
  GetAttendanceCalendarResponse,
  GetAttendanceResponse,
  GetAttendancesDto,
  GetAttendancesResponse,
  UpdateAttendanceDto,
  UpdateAttendanceResponse
} from "./dtos";

// USER
export type ClockInFn = (
  userId: number,
  organizationId: number,
  data: ClockInDto
) => Promise<AttendanceClockResponse>;

export type ClockOutFn = (
  userId: number,
  organizationId: number,
  data: ClockOutDto
) => Promise<AttendanceClockResponse>;

export type CreateAttendanceFn = (
  organizationId: number,
  actorUserId: number,
  data: CreateAttendanceDto
) => Promise<CreateAttendanceResponse>;

export type GetAttendanceFn = (
  attendanceId: number,
  organizationId: number,
  actorUserId: number
) => Promise<GetAttendanceResponse | null>;

export type GetAttendancesFn = (
  filters: GetAttendancesDto,
  organizationId: number,
  actorUserId: number,
  actorRole: string
) => Promise<GetAttendancesResponse>;

export type GetAttendanceCalendarFn = (
  data: GetAttendanceCalendarDto,
  organizationId: number,
  actorUserId: number,
  actorRole: string
) => Promise<GetAttendanceCalendarResponse>;

export type UpdateAttendanceFn = (
  attendanceId: number,
  organizationId: number,
  actorUserId: number,
  data: UpdateAttendanceDto
) => Promise<UpdateAttendanceResponse>;

export type DeleteAttendanceFn = (
  attendanceId: number,
  organizationId: number,
  actorUserId: number
) => Promise<DeleteAttendanceResponse>;
