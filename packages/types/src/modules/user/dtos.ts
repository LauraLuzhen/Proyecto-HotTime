import { Role } from "../../shared/common";

// CREATE
export interface CreateUserDto {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  birthDate: Date;
  phone: string;
  categoryId: number | null;
}
export interface CreateUserResponse {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  birthDate: Date;
  phone: string;
  categoryId: number | null;
  initDate: Date;
  organizationId: number;
};

// GET
export interface GetUsersQueryDto {
  fullName?: string;
  role?: Role;
  categoryId?: number;
}
export interface GeneralUserResponse {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  birthDate: Date;
  initDate: Date;
  phone: string;
  imgProfile: string | null;
  organizationId: number;
  categoryId: number | null;
}
export interface MeResponse {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  phone: string;
  imgProfile: string | null;
  birthDate: Date;
  initDate: Date;
  category: {
    id: number;
    name: string;
  } | null;
  organization: {
    id: number;
    name: string;
  };
}

// UPDATE
export interface UpdateMeDto {
  fullName?: string;
  email?: string;
  password?: string;
  birthDate?: Date;
  phone?: string;
  imgProfile?: string | null;
}
export interface UpdateUsersDto {
  fullName?: string;
  email?: string;
  password?: string;
  birthDate?: Date;
  phone?: string;
  imgProfile?: string | null;
  role?: Role;
  initDate?: Date;
  categoryId?: number | null;
}

// DELETE
export interface DeleteUserResponse {
  success: boolean;
}
