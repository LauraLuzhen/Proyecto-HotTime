import { FastifyInstance } from "fastify";
import type {
  CreateCommunicationDTO,
  InboxItemDTO,
  OutboxItemDTO,
  UnreadCountDTO,
} from "@hottime/types";
import { httpError } from "../../lib/httpError";
import { authenticate } from "../../plugins/auth";
import * as service from "./service";
import {
  createCommunicationSchema,
  communicationIdSchema,
} from "./schemas";

export async function communicationRoutes(app: FastifyInstance) {

  // CREATE
  app.post(
    "/",
    { preHandler: [authenticate] },
    async (req: any, reply) => {
      const parsed = createCommunicationSchema.safeParse(req.body);

      if (!parsed.success) {
        return reply
          .status(400)
          .send(httpError("Invalid data", 400, "VALIDATION_ERROR"));
      }

      return service.createCommunication(
        parsed.data,
        req.user.id,
        req.user.organizationId,
        req.user.role
      );
    }
  );

  // INBOX
  app.get(
    "/inbox",
    { preHandler: [authenticate] },
    async (req: any) => {
      return service.getInbox(req.user.id);
    }
  );

  // OUTBOX
  app.get(
    "/outbox",
    { preHandler: [authenticate] },
    async (req: any) => {
      return service.getOutbox(req.user.id);
    }
  );

  // GET ONE
  app.get(
    "/:id",
    { preHandler: [authenticate] },
    async (req: any, reply) => {
      const parsed = communicationIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return reply
          .status(400)
          .send(httpError("Invalid id", 400, "INVALID_ID"));
      }

      return service.getCommunication(parsed.data.id, req.user.id);
    }
  );

  // MARK AS READ
  app.put(
    "/:id/read",
    { preHandler: [authenticate] },
    async (req: any, reply) => {
      const parsed = communicationIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return reply
          .status(400)
          .send(httpError("Invalid id", 400, "INVALID_ID"));
      }

      return service.markAsRead(req.user.id, parsed.data.id);
    }
  );

  // COUNT UNREAD
  app.get(
    "/unread/count",
    { preHandler: [authenticate] },
    async (req: any) => {
      return service.countUnread(req.user.id);
    }
  );

  // DELETE
  app.delete(
    "/:id",
    { preHandler: [authenticate] },
    async (req: any, reply) => {
      const parsed = communicationIdSchema.safeParse(req.params);

      if (!parsed.success) {
        return reply
          .status(400)
          .send(httpError("Invalid id", 400, "INVALID_ID"));
      }

      return service.deleteCommunication(
        parsed.data.id,
        req.user.id
      );
    }
  );
}