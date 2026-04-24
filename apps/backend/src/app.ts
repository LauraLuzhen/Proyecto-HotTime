import Fastify from "fastify";
import cors from "@fastify/cors";

import { userRoutes } from "./modules/user/routes";
import { authRoutes } from "./modules/auth/routes";

export const buildApp = async () => {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  
  app.register(userRoutes, { prefix: "/users" });
  app.register(authRoutes, { prefix: "/auth" });

  return app;
};