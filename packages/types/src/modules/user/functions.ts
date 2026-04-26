import type { AdminCreateUserDto, UpdateMeDto, UserFiltersDto } from "./dtos";
import type { PublicUserEntity, UserEntity } from "./entities";

export type GetUsersFn = (
  filters: UserFiltersDto,
  userId: number,
  organizationId: number
) => Promise<UserEntity[]>;

export type GetMyUserFn = (userId: number) => Promise<PublicUserEntity>;

export type AdminCreateUserFn = (
  data: AdminCreateUserDto,
  organizationId: number
) => Promise<UserEntity>;

export type UpdateMyUserFn = (userId: number, data: UpdateMeDto) => Promise<UserEntity>;
export type ChangeMyPasswordFn = (
  userId: number,
  currentPassword: string,
  newPassword: string
) => Promise<UserEntity>;
export type AdminDeleteUserFn = (userId: number) => Promise<UserEntity>;
