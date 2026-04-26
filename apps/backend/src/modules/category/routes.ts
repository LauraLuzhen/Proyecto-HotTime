import type { CategoryIdParamDto, CreateCategoryDto, UpdateCategoryDto } from "@hottime/types";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { authenticate } from "@/plugins/auth";
import { httpError } from "@/lib/httpError";
import { requireRole } from "@/plugins/roles";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from "@/modules/category/schemas";
import * as service from "@/modules/category/service";

export async function categoryRoutes(app: FastifyInstance) {

  // Get categories
  app.get(
    "/",
    { preHandler: [authenticate] },
    async (req: FastifyRequest) => { return service.getCategories(req.user.organizationId); }
  );

  // Get users by category
  app.get(
    "/:id/users",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: CategoryIdParamDto }>, reply) => {
      const parsed = categoryIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return reply.status(400).send(httpError("Invalid category id", 400, "INVALID_ID"));
      }

      return service.getUsersFromCategory(
        parsed.data.id,
        req.user.organizationId
      );
    }
  );

  // Create category
  app.post(
    "/",
    {
      preHandler: [
        authenticate,
        requireRole(["ADMIN"]),
      ],
    },
    async (req: FastifyRequest<{ Body: CreateCategoryDto }>, reply) => {
      const parsed = createCategorySchema.safeParse(req.body);

      if (!parsed.success) {
        return reply.status(400).send(httpError("Invalid data", 400, "VALIDATION_ERROR"));
      }

      return service.createCategory(
        parsed.data.name,
        req.user.organizationId
      );
    }
  );

  // Update category
  app.put(
    "/:id",
    {
      preHandler: [
        authenticate,
        requireRole(["ADMIN"]),
      ],
    },
    async (req: FastifyRequest<{ Params: CategoryIdParamDto; Body: UpdateCategoryDto }>, reply) => {
      const idParsed = categoryIdSchema.safeParse(req.params);
      const bodyParsed = updateCategorySchema.safeParse(req.body);

      if (!idParsed.success || !bodyParsed.success) {
        return reply.status(400).send(httpError("Invalid data", 400, "VALIDATION_ERROR"));
      }

      return service.updateCategory(
        idParsed.data.id,
        bodyParsed.data.name,
        req.user.organizationId
      );
    }
  );

  // Delete category
  app.delete(
    "/:id",
    {
      preHandler: [
        authenticate,
        requireRole(["ADMIN"]),
      ],
    },
    async (req: FastifyRequest<{ Params: CategoryIdParamDto }>, reply) => {
      const parsed = categoryIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return reply.status(400).send(httpError("Invalid category id", 400, "INVALID_ID"));
      }

      return service.deleteCategory(
        parsed.data.id,
        req.user.organizationId
      );
    }
  );
}