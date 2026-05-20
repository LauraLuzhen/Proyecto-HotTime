export interface LoginDto {
  email: string;
  password: string;
}
export interface LogInResponse {
  token: string;
}

export interface ForgotPasswordDto {
  email: string;
}
export interface ForgotPasswordResponse {
  resetToken: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}
export interface SuccessResponse {
  success: boolean;
}
