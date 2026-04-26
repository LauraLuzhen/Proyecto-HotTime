import { verifyToken } from "../lib/jwt";
import { httpError } from "../lib/httpError";

export async function authenticate(req: any, reply: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.status(401).send(
      httpError("No token provided", 401, "NO_TOKEN")
    );
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    req.user = decoded;
    return;
  } catch {
    return reply.status(401).send(
      httpError("Invalid token", 401, "INVALID_TOKEN")
    );
  }
}