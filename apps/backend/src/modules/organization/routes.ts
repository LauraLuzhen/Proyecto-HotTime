import type { FastifyInstance } from "fastify";
import { httpError } from "@/lib/httpError";
import { authenticate } from "@/plugins/auth";
import { requireRole } from "@/plugins/roles";
import * as service from "@/modules/organization/service";
import { updateOrganizationSchema } from "./schemas";

export async function organizationRoutes(app: FastifyInstance) {
  //#region Get
  // Get organization
  app.get("/", { preHandler: [authenticate] }, async (req, reply) => {
    const organization = await service.getOrganization(req.user.organizationId);
    return reply.send(organization);
  });
  //#endregion

  //#region Update
  // Update organization
  app.patch("/", { preHandler: [authenticate, requireRole(["ADMIN"])] }, async (req, reply) => {
    const parsed = updateOrganizationSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send(httpError("Invalid organization data", 400, "VALIDATION_ERROR"));
    const organization = await service.updateOrganization(req.user.organizationId, parsed.data);
    
    return reply.send(organization);
  });
  //#endregion
}
