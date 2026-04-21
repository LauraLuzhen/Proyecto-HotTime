import Fastify from "fastify";
import cors from "@fastify/cors";

import { userRoutes } from "./modules/user/routes";
import { authRoutes } from "./modules/auth/routes";
import { authPlugin } from "./plugins/auth";

export const buildApp = async () => {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
  });
  
  // 🔐 GLOBAL AUTH
  await app.register(authPlugin);

  app.register(userRoutes, { prefix: "/users" });
  app.register(authRoutes, { prefix: "/auth" });

  return app;
};