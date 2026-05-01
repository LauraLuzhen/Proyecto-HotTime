import type { LoginDto, ForgotPasswordDto, ResetPasswordDto, LogInResponse, ForgotPasswordResponse, SuccessResponse } from "./dtos";

export type LoginFn = (data: LoginDto) => Promise<LogInResponse>;
export type ForgotPasswordFn = (data: ForgotPasswordDto) => Promise<ForgotPasswordResponse>;
export type ResetPasswordFn = (data: ResetPasswordDto) => Promise<SuccessResponse>;
