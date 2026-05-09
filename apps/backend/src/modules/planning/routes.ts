import type { FastifyInstance } from "fastify";
import { httpError } from "@/lib/httpError";
import { authenticate } from "@/plugins/auth";
import { requireRole } from "@/plugins/roles";
import * as service from "@/modules/planning/service";
import {
  attendanceQuerySchema,
  clockSchema,
  createManyShiftsSchema,
  createShiftSchema,
  planningRangeQuerySchema,
  planningUserQuerySchema,
  shiftIdSchema,
  updateShiftSchema,
} from "./schemas";

export async function planningRoutes(app: FastifyInstance) {
  // Create one shift by ADMIN/MANAGER
  app.post("/shifts", { preHandler: [authenticate, requireRole(["ADMIN", "MANAGER"])] }, async (req, reply) => {
    const parsed = createShiftSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid shift data", 400, "VALIDATION_ERROR"));

    const shift = await service.createShift(parsed.data, req.user.id, req.user.organizationId);
    return reply.status(201).send(shift);
  });

  // Create shifts for several users by ADMIN/MANAGER
  app.post("/shifts/bulk", { preHandler: [authenticate, requireRole(["ADMIN", "MANAGER"])] }, async (req, reply) => {
    const parsed = createManyShiftsSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid shifts data", 400, "VALIDATION_ERROR"));

    const shifts = await service.createManyShifts(parsed.data, req.user.id, req.user.organizationId);
    return reply.status(201).send(shifts);
  });

  // Get shifts by range/filters
  app.get("/shifts", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = planningRangeQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid shift filters", 400, "VALIDATION_ERROR"));

    const shifts = await service.getShifts(parsed.data, req.user.id, req.user.role, req.user.organizationId);
    return reply.send(shifts);
  });

  // Get next shift
  app.get("/shifts/next", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = planningUserQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid shift filters", 400, "VALIDATION_ERROR"));

    const shift = await service.getNextShift(parsed.data, req.user.id, req.user.role, req.user.organizationId);
    return reply.send(shift);
  });

  // Get current week shifts
  app.get("/shifts/week", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = planningUserQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid shift filters", 400, "VALIDATION_ERROR"));

    const shifts = await service.getWeekShifts(parsed.data, req.user.id, req.user.role, req.user.organizationId);
    return reply.send(shifts);
  });

  // Get current month shifts
  app.get("/shifts/month", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = planningUserQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid shift filters", 400, "VALIDATION_ERROR"));

    const shifts = await service.getMonthShifts(parsed.data, req.user.id, req.user.role, req.user.organizationId);
    return reply.send(shifts);
  });

  // Get shift by id
  app.get("/shifts/:id", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = shiftIdSchema.safeParse(req.params);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid shift id", 400, "VALIDATION_ERROR"));

    const shift = await service.getShiftById(parsed.data.id, req.user.id, req.user.role, req.user.organizationId);
    return reply.send(shift);
  });

  // Update shift by ADMIN/MANAGER
  app.patch("/shifts/:id", { preHandler: [authenticate, requireRole(["ADMIN", "MANAGER"])] }, async (req, reply) => {
    const params = shiftIdSchema.safeParse(req.params);
    if (!params.success) return reply.status(400).send(httpError("Invalid shift id", 400, "VALIDATION_ERROR"));

    const parsed = updateShiftSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid shift data", 400, "VALIDATION_ERROR"));

    const shift = await service.updateShift(params.data.id, parsed.data, req.user.id, req.user.organizationId);
    return reply.send(shift);
  });

  // Delete shift by ADMIN/MANAGER
  app.delete("/shifts/:id", { preHandler: [authenticate, requireRole(["ADMIN", "MANAGER"])] }, async (req, reply) => {
    const parsed = shiftIdSchema.safeParse(req.params);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid shift id", 400, "VALIDATION_ERROR"));

    const result = await service.deleteShift(parsed.data.id, req.user.id, req.user.organizationId);
    return reply.send(result);
  });

  // Clock in current user
  app.post("/attendance/clock-in", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = clockSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid attendance data", 400, "VALIDATION_ERROR"));

    const attendance = await service.clockIn(parsed.data, req.user.id, req.user.organizationId);
    return reply.status(201).send(attendance);
  });

  // Clock out current user
  app.post("/attendance/clock-out", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = clockSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid attendance data", 400, "VALIDATION_ERROR"));

    const attendance = await service.clockOut(parsed.data, req.user.id, req.user.organizationId);
    return reply.status(201).send(attendance);
  });

  // Get attendance by range/filters
  app.get("/attendance", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = attendanceQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid attendance filters", 400, "VALIDATION_ERROR"));

    const attendance = await service.getAttendance(parsed.data, req.user.id, req.user.role, req.user.organizationId);
    return reply.send(attendance);
  });

  // Get current week attendance
  app.get("/attendance/week", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = planningUserQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid attendance filters", 400, "VALIDATION_ERROR"));

    const attendance = await service.getWeekAttendance(parsed.data, req.user.id, req.user.role, req.user.organizationId);
    return reply.send(attendance);
  });

  // Get current month attendance
  app.get("/attendance/month", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = planningUserQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid attendance filters", 400, "VALIDATION_ERROR"));

    const attendance = await service.getMonthAttendance(parsed.data, req.user.id, req.user.role, req.user.organizationId);
    return reply.send(attendance);
  });
}
