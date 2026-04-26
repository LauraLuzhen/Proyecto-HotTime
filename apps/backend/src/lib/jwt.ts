import jwt from "jsonwebtoken";
import type { JwtPayload } from "@hottime/types";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Crear token
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

// Verificar token
export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}