// entities.ts

import type { AttendanceType } from "../../shared/common";

export interface AttendanceEntity {
  id: number;
  organizationId: number;
  shiftId: number;
  userId: number;

  type: AttendanceType;

  latitude: number;
  longitude: number;
  distanceMeters: number;

  occurredAt: Date;
  createdAt: Date;
}
