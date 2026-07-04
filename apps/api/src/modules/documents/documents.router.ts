import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createDocumentSchema } from "./dto/documents.dto";
import { certifyDocument, verifyDocument } from "./documents.handler";
import type { HonoConfig } from "@/index";
import { requirePermission } from "@/shared/utils/permissions.middleware";
import { MODULES } from "@/shared/constants";

const router = new Hono<HonoConfig>();

// GET /verify/:id (público) - Sin requiresAuth en el index !
router.get("/verify/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  const { data, error } = await verifyDocument(db, id);

  if (error) {
    return c.json({ data: null, message: error }, 200);
  }

  return c.json(data);
});

// POST / (protegido por requirePermission)
router.post(
  "/",
  requirePermission(MODULES.DOCUMENTS),
  zValidator("json", createDocumentSchema),
  async (c) => {
    const db = c.get("db");
    const permissionContext = c.get("permissionContext");
    const userId = permissionContext.userId;

    const data = c.req.valid("json");
    const result = await certifyDocument(db, data, userId);

    return c.json(result, 201);
  }
);

export default router;
