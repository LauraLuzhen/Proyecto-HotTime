import type { FastifyInstance } from "fastify";
import { httpError } from "@/lib/httpError";
import { authenticate } from "@/plugins/auth";
import { requireRole } from "@/plugins/roles";
import * as service from "@/modules/communication/service";
import { createCommunicationSchema, deleteInboxSchema, getCommunicationIdSchema, getInboxSchema } from "./schemas";

export async function communicationRoutes(app: FastifyInstance) {
  // Create communication
  app.post("/", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = createCommunicationSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid communication data", 400, "VALIDATION_ERROR"));

    const communication = await service.createCommunication(
      parsed.data,
      req.user.id,
      req.user.organizationId
    );

    return reply.status(201).send(communication);
  });

  // Get inbox communications
  app.get("/inbox", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = getInboxSchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid filters", 400, "VALIDATION_ERROR"));

    const communications = await service.getInboxCommunications(
      req.user.id,
      req.user.organizationId,
      parsed.data
    );

    return reply.send(communications);
  });

  // Get outbox communications
  app.get("/outbox", { preHandler: [authenticate] }, async (req, reply) => {
    const communications = await service.getOutboxCommunications(
      req.user.id,
      req.user.organizationId
    );

    return reply.send(communications);
  });

  // Get count read communications
  app.get("/inbox/count/read", { preHandler: [authenticate] }, async (req, reply) => {
    const result = await service.countInboxCommunications(req.user.id, req.user.organizationId, true);
    return reply.send(result);
  });

  // Get count unread communications
  app.get("/inbox/count/unread", { preHandler: [authenticate] }, async (req, reply) => {
    const result = await service.countInboxCommunications(req.user.id, req.user.organizationId, false);
    return reply.send(result);
  });

  // Hide selected inbox communications for the current user
  app.post("/inbox/hide", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = deleteInboxSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid communication data", 400, "VALIDATION_ERROR"));

    const result = await service.hideInboxCommunications(
      req.user.id,
      req.user.organizationId,
      parsed.data
    );

    return reply.send(result);
  });

  // Delete communications from database by ADMIN or MANAGER
  app.post("/delete", { preHandler: [authenticate, requireRole(["ADMIN", "MANAGER"])] }, async (req, reply) => {
    const parsed = deleteInboxSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid communication data", 400, "VALIDATION_ERROR"));

    const result = await service.deleteCommunications(
      req.user.id,
      req.user.organizationId,
      req.user.role,
      parsed.data
    );

    return reply.send(result);
  });

  // Get communication by id
  app.get("/:id", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = getCommunicationIdSchema.safeParse(req.params);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid communication id", 400, "VALIDATION_ERROR"));

    const communication = await service.getCommunicationById(
      parsed.data.id,
      req.user.id,
      req.user.organizationId
    );

    return reply.send(communication);
  });
}
