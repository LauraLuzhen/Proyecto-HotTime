import { FastifyInstance } from "fastify";

import { httpError } from "../../lib/httpError";
import { authenticate } from "../../plugins/auth";
import { requireRole } from "../../plugins/roles";
import {
  updateMeSchema,
  changePasswordSchema,
  adminCreateUserSchema
} from "./schemas";

import * as service from "./service";

export async function userRoutes(app: FastifyInstance) {

  // GET
  app.get(
    "/",
    {preHandler: [authenticate]},
    async (req: any) => {
      const query = req.query;
      return service.getUsers(query, req.user.id, req.user.organizationId);
    }
  );

  app.get(
    "/me",
    { preHandler: [authenticate] },
    async (req: any, reply) => {
      try {
        return await service.getMyUser(req.user.id);
      } catch (err: any) {
        return reply.status(404).send(httpError(err.message || "User not found", 404, "USER_NOT_FOUND"));
      }
    }
  );

  // CREATE
  app.post(
    "/",
    {preHandler: [authenticate, requireRole(["ADMIN"])]},
    async (req, reply) => {
      const parsed = adminCreateUserSchema.safeParse(req.body);

      if (!parsed.success) return reply.status(400).send(httpError("Invalid user data", 400, "VALIDATION_ERROR"));

      return service.adminCreateUser(parsed.data, req.user.organizationId);
    }
  );

  // UPDATE
  app.put(
    "/me",
    { preHandler: [authenticate] },
    async (req: any, reply) => {
      const parsed = updateMeSchema.safeParse(req.body);

      if (!parsed.success) return reply.status(400).send(parsed.error);

      return service.updateMyUser(req.user.id, parsed.data);
    }
  );

  app.put(
    "/me/password",
    { preHandler: [authenticate] },
    async (req: any, reply) => {
      const parsed = changePasswordSchema.safeParse(req.body);

      if (!parsed.success) return reply.status(400).send(httpError("Invalid data", 400, "VALIDATION_ERROR"));

      const { currentPassword, newPassword } = parsed.data;

      try {
        return await service.changeMyPassword(
          req.user.id,
          currentPassword,
          newPassword
        );
      } catch (err: any) {
        return reply.status(400).send(httpError(err.message, 400, "PASSWORD_ERROR"));
      }
    }
  );

  // DELETE
  app.delete(
    "/:id",
    {preHandler: [authenticate, requireRole(["ADMIN"])]},
    async (req, reply) => {
      const { id } = req.params as any;

      if (!id) return reply.status(400).send(httpError("User id is required", 400, "MISSING_ID"));

      return service.adminDeleteUser(Number(id));
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