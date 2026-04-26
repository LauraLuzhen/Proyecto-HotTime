import "fastify";
import type { AuthenticatedUser } from "@hottime/types";

declare module "fastify" {
  interface FastifyRequest {
    user: AuthenticatedUser;
  }
}
