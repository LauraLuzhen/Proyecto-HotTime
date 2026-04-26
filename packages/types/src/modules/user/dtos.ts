import type { Role } from "../../shared/common";

export interface UserFiltersDto {
  fullName?: string;
  role?: Role;
  categoryId?: string | number;
}

export interface AdminCreateUserDto {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  birthDate: string;
  initDate: string;
  phone: string;
  imgProfile?: string;
  categoryId?: number | null;
}

export interface UpdateMeDto {
  email?: string;
  phone?: string;
  imgProfile?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
