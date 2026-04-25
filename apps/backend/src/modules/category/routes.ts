import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/auth";
import * as service from "./service";
import { requireRole } from "../../plugins/roles";

export async function categoryRoutes(app: FastifyInstance) {
  
  // 📂 GET CATEGORIES DE MI ORGANIZACIÓN
  app.get(
    "/",
    { preHandler: [authenticate] },
    async (req: any) => {
      return service.getCategories(req.user.organizationId);
    }
  );

  // 👤 USERS POR CATEGORÍA
  app.get(
    "/:id/users",
    { preHandler: [authenticate] },
    async (req: any) => {
      const { id } = req.params;

      return service.getUsersFromCategory(
        Number(id),
        req.user.organizationId
      );
    }
  );

    // ➕ CREATE CATEGORY (ADMIN ONLY)
  app.post(
    "/",
    {
      preHandler: [
        authenticate,
        requireRole(["ADMIN"]),
      ],
    },
    async (req: any) => {
      const { name } = req.body;

      return service.createCategory(
        name,
        req.user.organizationId
      );
    }
  );

  // ✏️ UPDATE CATEGORY NAME (ADMIN ONLY)
  app.put(
    "/:id",
    {
      preHandler: [
        authenticate,
        requireRole(["ADMIN"]),
      ],
    },
    async (req: any) => {
      const { id } = req.params;
      const { name } = req.body;

      return service.updateCategory(
        Number(id),
        name,
        req.user.organizationId
      );
    }
  );

  // 🗑 DELETE CATEGORY (ADMIN ONLY)
  app.delete(
    "/:id",
    {
      preHandler: [
        authenticate,
        requireRole(["ADMIN"]),
      ],
    },
    async (req: any) => {
      const { id } = req.params;

      return service.deleteCategory(
        Number(id),
        req.user.organizationId
      );
    }
  );
}