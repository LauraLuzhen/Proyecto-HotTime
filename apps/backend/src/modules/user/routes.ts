import { FastifyInstance } from "fastify";
import * as service from "./service";
import { createUserSchema } from "./schemas";
import { authPlugin } from "../../plugins/auth";


export async function userRoutes(app: FastifyInstance) {
  // 🔐 TODAS protegidas
  app.register(authPlugin);

  app.get("/", async (req) => {
    return service.getUsers();
  });

  app.post("/", async (req, reply) => {
    const parsed = createUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.status(400).send(parsed.error);
    }

    return service.createUser(parsed.data);
  });
}