import type { FastifyInstance } from "fastify";
import { httpError } from "@/lib/httpError";
import { authenticate } from "@/plugins/auth";
import { requireRole } from "@/plugins/roles";
import { createUserSchema, getUserIdSchema, getUsersSchema, updateMeSchema, updateUsersSchema } from "@/modules/user/schemas";
import * as service from "@/modules/user/service";

export async function userRoutes(app: FastifyInstance) {
  // Create user by ADMIN
  app.post("/", { preHandler: [authenticate, requireRole(["ADMIN"])] }, async (req, reply) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid user data", 400, "VALIDATION_ERROR"));

    const user = await service.createUser(parsed.data, req.user.organizationId);
    return reply.status(201).send(user);
  });

  // Get me
  app.get("/me", { preHandler: [authenticate] }, async (req, reply) => {
    const user = await service.getMe(req.user.id);
    return reply.send(user);
  });

  // Get users
  app.get("/", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = getUsersSchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid filters", 400, "VALIDATION_ERROR"));

    const users = await service.getUsers(
      req.user.organizationId,
      parsed.data,
      req.user.id
    );
    return reply.send(users);
  });

  // Update me
  app.patch("/me", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid filters", 400, "VALIDATION_ERROR"));

    const user = await service.updateMe(req.user.id, parsed.data);
    return reply.send(user);
  });

  // Update users by ADMIN
  app.patch("/:id", { preHandler: [authenticate, requireRole(["ADMIN"])] }, async (req, reply) => {
    const idParsed = getUserIdSchema.safeParse(req.params);
    if (!idParsed.success) return reply.status(400).send(httpError("Invalid user id", 400, "VALIDATION_ERROR"));

    const parsed = updateUsersSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid filters", 400, "VALIDATION_ERROR"));

    const user = await service.updateUsers(
      idParsed.data.id,
      req.user.organizationId,
      req.user.id,
      parsed.data
    );
    return reply.send(user);
  });

  // Delete user by ADMIN
  app.delete("/:id", { preHandler: [authenticate, requireRole(["ADMIN"])] }, async (req, reply) => {
    const parsed = getUserIdSchema.safeParse(req.params);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid user data", 400, "VALIDATION_ERROR"));

    const result = await service.deleteUser(
      parsed.data.id,
      req.user.organizationId,
      req.user.id
    );

    return reply.send(result);
  });
}
