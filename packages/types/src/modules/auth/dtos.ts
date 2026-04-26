export interface LoginDto {
  email: string;
  password: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ForgotPasswordResponseDto {
  message: string;
}

export interface ResetPasswordResponseDto {
  message: string;
}
