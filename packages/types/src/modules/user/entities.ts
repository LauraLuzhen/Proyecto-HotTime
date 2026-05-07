import type { Role } from "../../shared/common";

export interface UserEntity {
  id: number;
  fullName: string;
  email: string;
  password: string;
  role: Role;
  birthDate: Date;
  initDate: Date;
  phone: string;
  imgProfile: string | null;
  organizationId: number;
  resetToken: string | null;
  resetTokenExp: Date | null;
}
