import type { LoginDto, ForgotPasswordResponseDto, ResetPasswordResponseDto } from "./dtos";
import type { PublicUserEntity, UserEntity } from "../user/entities";

export interface LoginResponseDto {
  token: string;
  user: UserEntity;
}

export type LoginFn = (data: LoginDto) => Promise<LoginResponseDto>;
export type ForgotPasswordFn = (email: string) => Promise<ForgotPasswordResponseDto>;
export type ResetPasswordFn = (token: string, password: string) => Promise<ResetPasswordResponseDto>;

export type GetProfileFromLoginResult = (result: LoginResponseDto) => PublicUserEntity;
