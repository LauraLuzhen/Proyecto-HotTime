import Fastify from "fastify";
import cors from "@fastify/cors";

export const buildApp = async () => {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
  });

  return app;
};