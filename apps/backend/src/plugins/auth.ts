import { FastifyInstance, FastifyRequest } from "fastify";
import { verifyToken } from "../lib/jwt";

declare module "fastify" {
  interface FastifyRequest {
    user?: any;
  }
}

export async function authPlugin(app: FastifyInstance) {
  app.decorateRequest("user", null);

  app.addHook("preHandler", async (request: FastifyRequest, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({ message: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      const decoded = verifyToken(token);
      request.user = decoded;
    } catch (err) {
      return reply.status(401).send({ message: "Invalid token" });
    }
  });
}