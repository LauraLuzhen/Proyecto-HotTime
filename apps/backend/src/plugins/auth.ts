import { FastifyInstance } from "fastify";
import { verifyToken } from "../lib/jwt";

export async function authPlugin(app: FastifyInstance) {
  app.decorateRequest("user", null);
}

export async function authenticate(req: any, reply: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return reply.status(401).send({ message: "No token" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);

    req.user = decoded;
  } catch {
    return reply.status(401).send({ message: "Invalid token" });
  }
}