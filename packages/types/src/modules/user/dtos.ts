import { Role } from "../../shared/common";

export interface UserCategoryResponse {
  id: number;
  name: string;
}

//#region Create
export interface CreateUserDto {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  birthDate: Date;
  phone: string;
  categoryIds: number[];
}
export interface CreateUserResponse {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  birthDate: Date;
  phone: string;
  categories: UserCategoryResponse[];
  initDate: Date;
  organizationId: number;
};
//#endregion

//#region Get
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
  categories: UserCategoryResponse[];
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
  categories: UserCategoryResponse[];
  organization: {
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
    allowedRadiusMeters: number | null;
  };
}
export interface GetUserByIdResponse {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  birthDate: Date;
  initDate: Date;
  phone: string;
  imgProfile: string | null;
  organizationId: number;
  categories: UserCategoryResponse[];
}
//#endregion

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
  categoryIds?: number[];
}

export interface DeleteUserResponse {
  success: boolean;
}
