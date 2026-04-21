import Fastify from "fastify";
import cors from "@fastify/cors";

import { authPlugin } from "./plugins/auth";
import { userRoutes } from "./modules/user/routes";
import { authRoutes } from "./modules/auth/routes";

export const buildApp = async () => {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  
  await app.register(authPlugin);
  app.register(userRoutes, { prefix: "/users" });
  app.register(authRoutes, { prefix: "/auth" });

  return app;
};