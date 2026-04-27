import type {
  AdminCreateUserDto,
  ChangePasswordDto,
  UpdateMeDto,
  UserEntity,
  UserFiltersDto,
} from "@hottime/types";

export interface UserWithRelations extends UserEntity {
  category?: unknown;
  organization?: unknown;
}

export type GetUsersQuery = UserFiltersDto;
export type GetUsersResponse = UserWithRelations[];

export type GetMeResponse = Omit<UserEntity, "password" | "resetToken" | "resetTokenExp">;

export type CreateUserRequest = AdminCreateUserDto;
export type CreateUserResponse = UserEntity;

export type UpdateMeRequest = UpdateMeDto;
export type UpdateMeResponse = UserEntity;

export type ChangePasswordRequest = ChangePasswordDto;
export type ChangePasswordResponse = UserEntity;

export type DeleteUserResponse = UserEntity;
