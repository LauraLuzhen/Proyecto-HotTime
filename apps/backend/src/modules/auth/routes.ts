import type { FastifyInstance } from "fastify";
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
    } catch {
      return reply.status(401).send(httpError("Invalid credentials", 401, "INVALID_CREDENTIALS"));
    }
  });

  // Forgot password
  app.post("/forgot-password", async (req, reply) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send(httpError("Validation error", 400, "VALIDATION_ERROR"));
    }
    try {
      return await service.forgotPassword(parsed.data);
    } catch {
      return reply.status(400).send(httpError("Error sending reset email", 400, "FORGOT_PASSWORD_ERROR"));
    }
  });

  // Reset password
  app.post("/reset-password", async (req, reply) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send(httpError("Validation error", 400, "VALIDATION_ERROR"));
    }
    try {
      return await service.resetPassword(parsed.data);
    } catch {
      return reply.status(400).send(httpError("Invalid or expired token", 400, "INVALID_TOKEN"));
    }
  });

  // GET /auth/reset-password?token=xxx
  // Redirige al deep link de Expo Go
  app.get("/reset-password", async (req, reply) => {
    const { token } = req.query as { token?: string };

    if (!token) {
      return reply.status(400).send("<p>Token inválido.</p>");
    }

    const expoHost = process.env.EXPO_GO_HOST ?? "172.16.0.213";
    const deepLink = `exp://${expoHost}:8081/--/reset-password?token=${token}`;

    return reply
      .status(200)
      .header("Content-Type", "text/html")
      .send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Redirigiendo a HotTime...</title>
          </head>
          <body style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h2>Abriendo HotTime...</h2>
            <p>Si la app no se abre automáticamente,
              <a href="${deepLink}">pulsa aquí</a>.
            </p>
            <script>
              window.location.href = "${deepLink}";
            </script>
          </body>
        </html>
      `);
  });
}