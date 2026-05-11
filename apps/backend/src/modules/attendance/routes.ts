import type { FastifyInstance } from "fastify";

import { authenticate } from "@/plugins/auth";
import { requireRole } from "@/plugins/roles";
import { httpError } from "@/lib/httpError";

import * as service from "./service";
import {
  attendanceIdParamsSchema,
  clockAttendanceSchema,
  createAttendanceSchema,
  getAttendancesSchema,
  updateAttendanceSchema,
} from "./schemas";

export async function attendanceRoutes(app: FastifyInstance) {
  app.post("/clock-in", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = clockAttendanceSchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.status(400).send(httpError("Invalid data", 400, "VALIDATION_ERROR"));
    }

    const result = await service.clockIn(
      req.user.id,
      req.user.organizationId,
      parsed.data
    );

    return reply.send(result);
  });

  app.post("/clock-out", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = clockAttendanceSchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.status(400).send(httpError("Invalid data", 400, "VALIDATION_ERROR"));
    }

    const result = await service.clockOut(
      req.user.id,
      req.user.organizationId,
      parsed.data
    );

    return reply.send(result);
  });

  app.post(
    "/",
    { preHandler: [authenticate, requireRole(["ADMIN", "MANAGER"])] },
    async (req, reply) => {
      const parsed = createAttendanceSchema.safeParse(req.body);

      if (!parsed.success) {
        return reply.status(400).send(
          httpError("Invalid attendance data", 400, "VALIDATION_ERROR")
        );
      }

      const result = await service.createAttendance(
        req.user.organizationId,
        req.user.id,
        parsed.data
      );

      return reply.status(201).send(result);
    }
  );

  app.get("/", { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = getAttendancesSchema.safeParse(req.query);

    if (!parsed.success) {
      return reply.status(400).send(
        httpError("Invalid query", 400, "VALIDATION_ERROR")
      );
    }

    const result = await service.getAttendances(
      parsed.data,
      req.user.organizationId,
      req.user.id,
      req.user.role
    );

    return reply.send(result);
  });

  app.get(
    "/:attendanceId",
    { preHandler: [authenticate] },
    async (req, reply) => {
      const params = attendanceIdParamsSchema.safeParse(req.params);

      if (!params.success) {
        return reply.status(400).send(
          httpError("Invalid attendance id", 400, "VALIDATION_ERROR")
        );
      }

      const result = await service.getAttendance(
        params.data.attendanceId,
        req.user.organizationId,
        req.user.id,
        req.user.role
      );

      if (!result) {
        return reply.status(404).send(
          httpError("Attendance not found", 404, "ATTENDANCE_NOT_FOUND")
        );
      }

      return reply.send(result);
    }
  );

  app.patch(
    "/:attendanceId",
    { preHandler: [authenticate, requireRole(["ADMIN", "MANAGER"])] },
    async (req, reply) => {
      const params = attendanceIdParamsSchema.safeParse(req.params);
      const body = updateAttendanceSchema.safeParse(req.body);

      if (!params.success || !body.success) {
        return reply.status(400).send(
          httpError("Invalid attendance update data", 400, "VALIDATION_ERROR")
        );
      }

      const result = await service.updateAttendance(
        params.data.attendanceId,
        req.user.organizationId,
        req.user.id,
        req.user.role,
        body.data
      );

      return reply.send(result);
    }
  );

  app.delete(
    "/:attendanceId",
    { preHandler: [authenticate, requireRole(["ADMIN", "MANAGER"])] },
    async (req, reply) => {
      const params = attendanceIdParamsSchema.safeParse(req.params);

      if (!params.success) {
        return reply.status(400).send(
          httpError("Invalid attendance id", 400, "VALIDATION_ERROR")
        );
      }

      const result = await service.deleteAttendance(
        params.data.attendanceId,
        req.user.organizationId,
        req.user.id,
        req.user.role
      );

      return reply.send(result);
    }
  );
}
