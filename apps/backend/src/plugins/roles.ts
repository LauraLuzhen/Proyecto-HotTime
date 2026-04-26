import { httpError } from "../lib/httpError";

export function requireRole(roles: string[]) {
  return async (req: any, reply: any) => {
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