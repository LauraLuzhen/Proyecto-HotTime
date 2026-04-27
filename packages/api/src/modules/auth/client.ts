import { HttpClient } from "../../core/httpClient";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "./contracts";

export class AuthApi {
  constructor(private readonly http: HttpClient) {}

  login(data: LoginRequest): Promise<LoginResponse> {
    return this.http.post<LoginResponse, LoginRequest>("/auth/login", data);
  }

  forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse, ForgotPasswordRequest>("/auth/forgot-password", data);
  }

  resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse, ResetPasswordRequest>("/auth/reset-password", data);
  }
}
