import type { AttendanceType } from "../../shared/common";
import type { AttendanceEntity } from "./entities";

/* ---------------- CLOCK IN / OUT ---------------- */

export interface ClockDto {
  shiftId: number;
  latitude: number;
  longitude: number;
}

export type ClockInDto = ClockDto;
export type ClockOutDto = ClockDto;

export type AttendanceResponse = AttendanceEntity;
export type AttendanceClockResponse = AttendanceEntity;

/* ---------------- CRUD ---------------- */

export interface CreateAttendanceDto {
  shiftId: number;
  type: AttendanceType;
  occurredAt?: Date;
}

export interface UpdateAttendanceDto {
  shiftId?: number;
  type?: AttendanceType;
  occurredAt?: Date;
}

export interface GetAttendancesDto {
  attendanceId?: number;
  userId?: number;
  shiftId?: number;
  type?: AttendanceType;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export interface CreateAttendanceResponse {
  attendance: AttendanceEntity;
}

export interface GetAttendanceResponse {
  attendance: AttendanceEntity;
}

export interface GetAttendancesResponse {
  attendances: AttendanceEntity[];
  total: number;
}

export interface UpdateAttendanceResponse {
  attendance: AttendanceEntity;
}

export interface DeleteAttendanceResponse {
  success: boolean;
}
