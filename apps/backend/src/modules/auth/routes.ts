import { FastifyInstance } from "fastify";
import { loginSchema } from "./schemas";
import * as service from "./service";

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (req, reply) => {
    console.log("🔥 LOGIN HIT");

    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.status(400).send(parsed.error);
    }

    try {
      const result = await service.login(parsed.data);
      return result;
    } catch (err) {
      return reply.status(401).send({
        message: "Invalid credentials",
      });
    }
  });
}