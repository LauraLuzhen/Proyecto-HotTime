import type { FastifyInstance } from "fastify";
import { httpError } from "@/lib/httpError";
import { authenticate } from "@/plugins/auth";
import * as service from "@/modules/comunication/service";
import { createCommunicationSchema, getCommunicationIdSchema, getInboxSchema } from "./schemas";

export async function communicationRoutes(app: FastifyInstance) {
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

  app.get("/outbox", { preHandler: [authenticate] }, async (req, reply) => {
    const communications = await service.getOutboxCommunications(
      req.user.id,
      req.user.organizationId
    );

    return reply.send(communications);
  });

  app.get("/inbox/count/read", { preHandler: [authenticate] }, async (req, reply) => {
    const result = await service.countInboxCommunications(req.user.id, req.user.organizationId, true);
    return reply.send(result);
  });

  app.get("/inbox/count/unread", { preHandler: [authenticate] }, async (req, reply) => {
    const result = await service.countInboxCommunications(req.user.id, req.user.organizationId, false);
    return reply.send(result);
  });

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
