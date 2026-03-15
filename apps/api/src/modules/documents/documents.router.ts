import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createDocumentSchema } from "./dto/documents.dto";
import { certifyDocument, verifyDocument } from "./documents.handler";
import type { HonoConfig } from "@/index";

const router = new Hono<HonoConfig>();

// GET /verify/:id (público) - Sin requiresAuth en el index !
router.get("/verify/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  const { data, error } = await verifyDocument(db, id);

  if (error) {
    return c.json({ message: error }, 404);
  }

  return c.json(data);
});

// POST / (protegido por requireAuth en el index)
router.post(
  "/",
  zValidator("json", createDocumentSchema),
  async (c) => {
    const db = c.get("db");
    const sessionResult = c.get("session") as { user?: { id: string } };
    const user = sessionResult?.user;
    
    if (!user || !user.id) {
       return c.json({ message: "No autorizado" }, 401);
    }

    const data = c.req.valid("json");
    const result = await certifyDocument(db, data, user.id);

    return c.json(result, 201);
  }
);

export default router;
