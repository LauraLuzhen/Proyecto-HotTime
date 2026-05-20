import type { FastifyInstance } from "fastify";
import { httpError } from "@/lib/httpError";
import { authenticate } from "@/plugins/auth";
import { requireRole } from "@/plugins/roles";
import * as service from "@/modules/category/service";
import { getUsersByCategorySchema, createCategorySchema, updateCategorySchema, deleteCategorySchema, updateCategoryParamsSchema } from "./schemas";

export async function categoryRoutes(app: FastifyInstance) {
  //#region Create
  // Create category
  app.post("/", { preHandler: [authenticate, requireRole(["ADMIN"])] }, async (req, reply) => {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid data", 400, "VALIDATION_ERROR"));
    const category = await service.createCategory(parsed.data, req.user.organizationId);
    return reply.status(201).send(category);
  });
  //#endregion

  //#region Get
  // Get categories
  app.get("/", { preHandler: [authenticate] }, async (req, reply) => {
    const categories = await service.getCategories(req.user.organizationId);
    return reply.send(categories);
  });
  // Get users by category
  app.get("/:categoryId/users", { preHandler: [authenticate] },async (req, reply) => {
    const parsed = getUsersByCategorySchema.safeParse(req.params);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid categoryId", 400, "VALIDATION_ERROR"));
    const users = await service.getUsersByCategory(parsed.data.categoryId, req.user.organizationId);
    return reply.send(users);
  });
  //#endregion

  //#region Update
  // Update category by ADMIN
  app.patch("/:id", { preHandler: [authenticate, requireRole(["ADMIN"])] }, async (req, reply) => {
    const params = updateCategoryParamsSchema.safeParse(req.params);
    if (!params.success) return reply.status(400).send(httpError("Invalid categoryId", 400, "VALIDATION_ERROR"));
    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid data", 400, "VALIDATION_ERROR"));  
    const category = await service.updateCategory(params.data.id, req.user.organizationId, parsed.data);
    return reply.send(category);
  });
  //#endregion

  //#region Delete
  // Delete category by ADMIN
  app.delete("/:id", { preHandler: [authenticate, requireRole(["ADMIN"])] }, async (req, reply) => {
    const parsed = deleteCategorySchema.safeParse(req.params);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid categoryId", 400, "VALIDATION_ERROR"));
    const result = await service.deleteCategory(parsed.data.id, req.user.organizationId);
    return reply.send(result);
  });
}
