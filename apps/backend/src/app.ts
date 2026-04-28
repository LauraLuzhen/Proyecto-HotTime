import Fastify from "fastify";
import cors from "@fastify/cors";

import { userRoutes } from "@/modules/user/routes";
import { authRoutes } from "@/modules/auth/routes";
import { categoryRoutes } from "@/modules/category/routes";
import { communicationRoutes } from "@/modules/comunication/routes";

export const buildApp = async () => {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  
  app.register(userRoutes, { prefix: "/users" });
  app.register(authRoutes, { prefix: "/auth" });
  app.register(categoryRoutes, { prefix: "/categories" });
  app.register(communicationRoutes, { prefix: "/communications" });

  app.setErrorHandler((error:any, req, reply) => {
    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        message: error.message,
        code: error.code,
      });
    }

    console.error(error);

    reply.status(500).send({
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  });

  return app;
};