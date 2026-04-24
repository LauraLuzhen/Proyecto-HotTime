import { FastifyInstance } from "fastify";
import * as service from "./service";
import { authenticate } from "../../plugins/auth";
import { requireRole } from "../../plugins/roles";

import {
  updateMeSchema,
  changePasswordSchema,
} from "./schemas";

export async function userRoutes(app: FastifyInstance) {

  app.get(
  "/",
  {
    preHandler: [authenticate],
  },
  async (req) => {
    const query = req.query as any;
    return service.getUsers(query);
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


  // 👤 GET ME
  app.get(
    "/me",
    { preHandler: [authenticate] },
    async (req: any) => {
      return service.getMyUser(req.user.id);
    }
  );

  // ✏️ UPDATE ME (email, phone, img)
  app.put(
    "/me",
    { preHandler: [authenticate] },
    async (req: any, reply) => {
      const parsed = updateMeSchema.safeParse(req.body);

      if (!parsed.success) {
        return reply.status(400).send(parsed.error);
      }

      return service.updateMyUser(req.user.id, parsed.data);
    }
  );

  // 🔐 CHANGE PASSWORD
  app.put(
    "/me/password",
    { preHandler: [authenticate] },
    async (req: any, reply) => {
      const parsed = changePasswordSchema.safeParse(req.body);

      if (!parsed.success) {
        return reply.status(400).send(parsed.error);
      }

      const { currentPassword, newPassword } = parsed.data;

      return service.changeMyPassword(
        req.user.id,
        currentPassword,
        newPassword
      );
    }
  );
}