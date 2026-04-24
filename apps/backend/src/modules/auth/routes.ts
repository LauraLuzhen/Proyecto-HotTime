import { FastifyInstance } from "fastify";
import { resetPasswordSchema } from "./schemas";

import { loginSchema } from "./schemas";
import * as service from "./service";

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (req, reply) => {
    console.log("🟢Login HIT");

    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.status(400).send(parsed.error);
    }

    try {
      const result = await service.login(parsed.data);
      return result;
    } catch (err) {
      return reply.status(401).send({
        message: "🟡Invalid credentials",
      });
    }
  });

  // FORGOT
app.post("/forgot-password", async (req, reply) => {
  const { email } = req.body as any;
  return service.forgotPassword(email);
});

// RESET
app.post("/reset-password", async (req, reply) => {
  const parsed = resetPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return reply.status(400).send(parsed.error);
  }

  try {
    return await service.resetPassword(
      parsed.data.token,
      parsed.data.password
    );
  } catch (err) {
    return reply.status(400).send({
      message: "Invalid or expired token",
    });
  }
});
}