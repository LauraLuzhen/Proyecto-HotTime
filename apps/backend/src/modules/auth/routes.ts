import type { FastifyInstance, FastifyRequest } from "fastify";
import { httpError } from "@/lib/httpError";
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/modules/auth/schemas";
import * as service from "@/modules/auth/service";

export async function authRoutes(app: FastifyInstance) {
  // LogIn
  app.post("/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Validation error", 400, "VALIDATION_ERROR"));
    try {
      const result = await service.login(parsed.data);
      return result;
    } catch (err) {
      return reply.status(401).send(httpError("Invalid credentials", 401, "INVALID_CREDENTIALS"));
    }
  });

  // Forgot password
  app.post("/forgot-password", async (req, reply) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Validation error", 400, "VALIDATION_ERROR"));
    try {
      const result = await service.forgotPassword(parsed.data);
      return result;
    } catch (err) {
      return reply.status(400).send(httpError("Error sending reset email", 400, "FORGOT_PASSWORD_ERROR"));
    }
  });

  // Reset password
  app.post("/reset-password", async (req, reply) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Validation error", 400, "VALIDATION_ERROR"));
    try {
      const result = await service.resetPassword(parsed.data);
      return result;
    } catch (err) {
      return reply.status(400).send(httpError("Invalid or expired token", 400, "INVALID_TOKEN"));
    }
  });
}
