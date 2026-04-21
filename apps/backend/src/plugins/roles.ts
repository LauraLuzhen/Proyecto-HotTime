export function requireRole(roles: string[]) {
  return async (req: any, reply: any) => {
    if (!req.user) {
      return reply.status(401).send({ message: "🔴Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return reply.status(403).send({ message: "🟡Forbidden" });
    }
  };
}