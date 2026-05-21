import type { LoginFn, ForgotPasswordFn, ResetPasswordFn } from "@hottime/types";
import { comparePassword, hashPassword } from "@/lib/hash";
import { httpError } from "@/lib/httpError";
import { signToken } from "@/lib/jwt";
import * as userRepo from "@/modules/user/repository";
import type { ForgotPasswordInput, LoginInput, ResetPasswordInput } from "@/modules/auth/schemas";
import crypto from "crypto";
import { resend } from "@/lib/resend";

// LogIn
export const login: LoginFn = async (data: LoginInput) => {
  const user = await userRepo.findByEmailOrNull(data.email);
  if (!user) throw httpError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  const isValid = await comparePassword(data.password, user.password);
  if (!isValid) throw httpError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  return {
    token: signToken({
      id: user.id,
      role: user.role,
      organizationId: user.organizationId,
    }),
  };
};

// Forgot password
export const forgotPassword: ForgotPasswordFn = async (data: ForgotPasswordInput) => {
  const user = await userRepo.findByEmailOrNull(data.email);

  if (!user) return { success: true };

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 30);
  await userRepo.setResetToken(user.id, token, expires);

  const apiUrl = process.env.API_PUBLIC_URL ?? "http://192.168.1.129:3001";
  const resetUrl = `${apiUrl}/auth/reset-password?token=${token}`;

  const result = await resend.emails.send({
    from: "HotTime <no-reply@hottime.work.gd>",
    to: user.email,
    subject: "Restablece tu contraseña",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1a1a2e;">Restablecer contraseña</h2>
          <p style="color: #555;">Pulsa el botón para restablecer tu contraseña. El enlace caduca en 30 minutos.</p>
          <a href="${resetUrl}"
            style="display: inline-block; background: #4f6ef7; color: #fff;
                   text-decoration: none; padding: 14px 28px; border-radius: 12px;
                   font-weight: 700; margin: 16px 0;">
            Restablecer contraseña
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">
            Si no solicitaste este cambio, ignora este correo.
          </p>
        </body>
      </html>
    `,
  });

  console.log("[forgotPassword] Resend result:", JSON.stringify(result));

  return { success: true };
};

// Reset password
export const resetPassword: ResetPasswordFn = async (data: ResetPasswordInput) => {
  const user = await userRepo.findByResetToken(data.token);

  if (!user.resetTokenExp || user.resetTokenExp < new Date()) {
    throw httpError("Invalid or expired token", 400, "INVALID_TOKEN");
  }

  const hashedPassword = await hashPassword(data.password);
  await userRepo.updatePassword(user.id, hashedPassword);
  await userRepo.clearResetToken(user.id);

  return { success: true };
};