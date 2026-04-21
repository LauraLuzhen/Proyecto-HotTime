import { FastifyInstance } from "fastify";
import * as service from "./service";
import { authenticate } from "../../plugins/auth";
import { requireRole } from "../../plugins/roles";

export async function userRoutes(app: FastifyInstance) {
  
  app.get(
    "/",
    {
      preHandler: [
        authenticate,
        requireRole(["ADMIN", "MANAGER"]),
      ],
    },
    async (req) => {
      return service.getUsers();
    }
  );

  app.post(
    "/",
    {
      preHandler: [
        authenticate,
        requireRole(["ADMIN"]),
      ],
    },
    async (req) => {
      return service.createUser(req.body);
    }
  );
}