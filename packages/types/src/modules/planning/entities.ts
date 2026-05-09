import type { AttendanceType, ShiftStatus } from "../../shared/common";

export interface ShiftEntity {
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
}

export interface AttendanceEntity {
  id: number;
  organizationId: number;
  shiftId: number;
  userId: number;
  type: AttendanceType;
  occurredAt: Date;
  createdAt: Date;
}
