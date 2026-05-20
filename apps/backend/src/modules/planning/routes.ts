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
  getCalendarShiftsSchema,
  shiftIdParamsSchema,
  updateShiftBodySchema
} from "@/modules/planning/schemas";
import * as service from "@/modules/planning/service";

export async function planningRoutes(app: FastifyInstance) {
  //#region Create
  // Create shift for user
  app.post("/shifts/user", {preHandler: [authenticate, requireRole(["ADMIN", "MANAGER"])]}, async (req, reply) => {
    const parsed = createShiftForUserSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid shift data", 400, "VALIDATION_ERROR"));
    const result = await service.createForUser(parsed.data, req.user.organizationId, req.user.id);
    return reply.status(201).send(result);
  });
  // Create shift for users
  app.post("/shifts/users", {preHandler: [authenticate, requireRole(["ADMIN", "MANAGER"])]}, async (req, reply) => {
    const parsed = createShiftForUsersSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid shifts data", 400, "VALIDATION_ERROR"));
    const result = await service.createForUsers(parsed.data, req.user.organizationId, req.user.id);
    return reply.status(201).send(result);
  });
  // Create shift for category
  app.post("/shifts/category", {preHandler: [authenticate, requireRole(["ADMIN", "MANAGER"])]}, async (req, reply) => {
    const parsed = createShiftForCategorySchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid category shift data", 400, "VALIDATION_ERROR"));
    const result = await service.createForCategory(parsed.data, req.user.organizationId, req.user.id);
    return reply.status(201).send(result);
  });
  //#endregion

  //#region Get
  // Get shift by id
  app.get("/shifts/:shiftId", {preHandler: [authenticate]}, async (req, reply) => {
    const parsed = getShiftByIdSchema.safeParse(req.params);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid shift id", 400, "VALIDATION_ERROR"));
    const result = await service.getById(parsed.data.shiftId, req.user.organizationId);
    if (!result) return reply.status(404).send(httpError("Shift not found", 404, "NOT_FOUND"));
    return reply.send(result);
  });
  // Get all shifts
  app.get("/shifts", {preHandler: [authenticate]}, async (req, reply) => {
    const parsed = getShiftsSchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid query params", 400, "VALIDATION_ERROR"));
    const result = await service.getAll(parsed.data, req.user.organizationId);
    return reply.send(result);
  });
  // Get shifts (calendar)
  app.get("/shifts/calendar", {preHandler: [authenticate]}, async (req, reply) => {
    const parsed = getCalendarShiftsSchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid query params", 400, "VALIDATION_ERROR"));
    const isAdmin = ["ADMIN", "MANAGER"].includes(req.user.role);
    const result = await service.getCalendarShifts({
      userId: isAdmin ? parsed.data.userId ?? req.user.id : req.user.id,
      date: parsed.data.date,
      includeNext: parsed.data.includeNext,
      includeWeek: parsed.data.includeWeek,
      includeMonth: parsed.data.includeMonth,
    }, req.user.organizationId);
    return reply.send(result);
  });
  //#endregion

  //#region Update
  app.patch("/shifts/:shiftId", {preHandler: [authenticate, requireRole(["ADMIN", "MANAGER"])]}, async (req, reply) => {
    const params = shiftIdParamsSchema.safeParse(req.params);
    const body = updateShiftBodySchema.safeParse(req.body);
    if (!params.success || !body.success) return reply.status(400).send({message: "Invalid shift update data", code: "VALIDATION_ERROR"});
    const result = await service.updateShift(
      {shiftId: params.data.shiftId, ...body.data},
      req.user.organizationId,
      req.user.id
    );
    return reply.send(result);
  });
  //#endregion

  //#region Delete
  app.delete("/shifts/:shiftId", {preHandler: [authenticate, requireRole(["ADMIN", "MANAGER"])]}, async (req, reply) => {
    const params = shiftIdParamsSchema.safeParse(req.params);
    if (!params.success) return reply.status(400).send({message: "Invalid shift id", code: "VALIDATION_ERROR"});
    const result = await service.deleteShift(params.data.shiftId, req.user.organizationId, req.user.id);
    return reply.send(result);
  });
  //#endregion
}
