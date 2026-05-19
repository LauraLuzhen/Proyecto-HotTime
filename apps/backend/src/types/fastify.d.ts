import "fastify";
import type { AuthenticatedUser } from "@hottime/types";

// Crea una nueva respues para fastify user con authenticate
declare module "fastify" {
  interface FastifyRequest {
    user: AuthenticatedUser;
  }
}
