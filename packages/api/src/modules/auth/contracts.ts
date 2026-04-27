import type {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  LoginDto,
  LoginResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from "@hottime/types";

export type LoginRequest = LoginDto;
export type LoginResponse = LoginResponseDto;

export type ForgotPasswordRequest = ForgotPasswordDto;
export type ForgotPasswordResponse = ForgotPasswordResponseDto;

export type ResetPasswordRequest = ResetPasswordDto;
export type ResetPasswordResponse = ResetPasswordResponseDto;
