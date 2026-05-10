// entities.ts

import type { ShiftStatus } from "../../shared/common";

export interface ShiftCategoryEntity {
  shiftId: number;
  categoryId: number;
}

export interface ShiftEntity {
  id: number;
  organizationId: number;
  userId: number;
  createdById: number;
  startsAt: Date;
  endsAt: Date;
  actualStartsAt: Date | null;
  actualEndsAt: Date | null;
  status: ShiftStatus;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  categories: ShiftCategoryEntity[];
}