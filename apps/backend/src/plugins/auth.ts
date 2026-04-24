import { verifyToken } from "../lib/jwt";

export async function authenticate(req: any, reply: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({ message: "🔴No token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    req.user = decoded;

    return;
  } catch {
    return reply.status(401).send({ message: "🟡Invalid token" });
  }
}