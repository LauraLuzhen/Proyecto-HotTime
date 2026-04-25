import { FastifyInstance } from "fastify";
import * as service from "./service";
import { authenticate } from "../../plugins/auth";
import { requireRole } from "../../plugins/roles";

import {
  updateMeSchema,
  changePasswordSchema,
  adminCreateUserSchema
} from "./schemas";

export async function userRoutes(app: FastifyInstance) {

app.get(
  "/",
  {
    preHandler: [authenticate],
  },
  async (req: any) => {
    const query = req.query;
    return service.getUsers(query, req.user.id, req.user.organizationId); // 👈 AÑADIR ESTO
  }
);

  // 👮 ADMIN: CREATE USER
  app.post(
    "/",
    {
      preHandler: [
        authenticate,
        requireRole(["ADMIN"]),
      ],
    },
    async (req, reply) => {
      const parsed = adminCreateUserSchema.safeParse(req.body);

      if (!parsed.success) {
        return reply.status(400).send(parsed.error);
      }

      return service.adminCreateUser(parsed.data, req.user.organizationId);
    }
  );

  // 👮 ADMIN: DELETE USER
  app.delete(
    "/:id",
    {
      preHandler: [
        authenticate,
        requireRole(["ADMIN"]),
      ],
    },
    async (req, reply) => {
      const { id } = req.params as any;

      return service.adminDeleteUser(Number(id));
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

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: number;
      role: "ADMIN" | "MANAGER" | "EMPLOYEE";
      organizationId: number;
    };
  }
}