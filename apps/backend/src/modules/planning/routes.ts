import type { FastifyInstance } from "fastify";
import { authenticate } from "@/plugins/auth";
import { requireRole } from "@/plugins/roles";
import { httpError } from "@/lib/httpError";

import {
  createShiftForUserSchema,
  createShiftForUsersSchema,
  createShiftForCategorySchema,
  getShiftByIdSchema,
  getShiftsSchema,
} from "@/modules/planning/schemas";

import * as service from "@/modules/planning/service";

export async function planningRoutes(app: FastifyInstance) {

  /* =========================
     CREATE SHIFT FOR USER
  ========================= */

  app.post(
    "/shifts/user",
    {
      preHandler: [
        authenticate,
        requireRole(["ADMIN", "MANAGER"]),
      ],
    },
    async (req, reply) => {
      const parsed = createShiftForUserSchema.safeParse(req.body);

      if (!parsed.success) {
        return reply
          .status(400)
          .send(httpError(
            "Invalid shift data",
            400,
            "VALIDATION_ERROR"
          ));
      }

      const result = await service.createForUser(
        parsed.data,
        req.user.organizationId,
        req.user.id
      );

      return reply.status(201).send(result);
    }
  );

  /* =========================
     CREATE SHIFT FOR USERS
  ========================= */

  app.post(
    "/shifts/users",
    {
      preHandler: [
        authenticate,
        requireRole(["ADMIN", "MANAGER"]),
      ],
    },
    async (req, reply) => {
      const parsed = createShiftForUsersSchema.safeParse(req.body);

      if (!parsed.success) {
        return reply
          .status(400)
          .send(httpError(
            "Invalid shifts data",
            400,
            "VALIDATION_ERROR"
          ));
      }

      const result = await service.createForUsers(
        parsed.data,
        req.user.organizationId,
        req.user.id
      );

      return reply.status(201).send(result);
    }
  );

  /* =========================
     CREATE SHIFT FOR CATEGORY
  ========================= */

  app.post(
    "/shifts/category",
    {
      preHandler: [
        authenticate,
        requireRole(["ADMIN", "MANAGER"]),
      ],
    },
    async (req, reply) => {
      const parsed = createShiftForCategorySchema.safeParse(req.body);

      if (!parsed.success) {
        return reply
          .status(400)
          .send(httpError(
            "Invalid category shift data",
            400,
            "VALIDATION_ERROR"
          ));
      }

      const result = await service.createForCategory(
        parsed.data,
        req.user.organizationId,
        req.user.id
      );

      return reply.status(201).send(result);
    }
  );

app.get(
  "/shifts/:shiftId",
  {
    preHandler: [authenticate],
  },
  async (req, reply) => {
    const parsed = getShiftByIdSchema.safeParse(req.params);

    if (!parsed.success) {
      return reply.status(400).send(
        httpError("Invalid shift id", 400, "VALIDATION_ERROR")
      );
    }

    const result = await service.getById(
      parsed.data.shiftId,
      req.user.organizationId
    );

    if (!result) {
      return reply.status(404).send(
        httpError("Shift not found", 404, "NOT_FOUND")
      );
    }

    return reply.send(result);
  }
);

app.get(
  "/shifts",
  {
    preHandler: [authenticate],
  },
  async (req, reply) => {
    const parsed = getShiftsSchema.safeParse(req.query);

    if (!parsed.success) {
      return reply.status(400).send(
        httpError("Invalid query params", 400, "VALIDATION_ERROR")
      );
    }

    const result = await service.getAll(
      parsed.data,
      req.user.organizationId
    );

    return reply.send(result);
  }
);

}