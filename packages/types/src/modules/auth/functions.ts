import type { LoginDto, ForgotPasswordDto, ResetPasswordDto, LogInResponse, SuccessResponse } from "./dtos";

export type LoginFn = (data: LoginDto) => Promise<LogInResponse>;
export type ForgotPasswordFn = (data: ForgotPasswordDto) => Promise<SuccessResponse>;
export type ResetPasswordFn = (data: ResetPasswordDto) => Promise<SuccessResponse>;
