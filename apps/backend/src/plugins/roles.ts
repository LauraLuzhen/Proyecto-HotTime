import type { FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "@hottime/types";
import { httpError } from "@/lib/httpError";

export function requireRole(roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.status(401).send(
        httpError("Unauthorized", 401, "UNAUTHORIZED")
      );
    }

    if (!roles.includes(req.user.role)) {
      return reply.status(403).send(
        httpError("Forbidden", 403, "FORBIDDEN")
      );
    }
    
    return;
  };
}