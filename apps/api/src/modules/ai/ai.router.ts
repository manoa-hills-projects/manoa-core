import { Hono } from "hono";
import type { HonoConfig } from "../../index";
import { getConversations, getMessages, createConversation, deleteConversation } from "./ai.handler";

const aiRouter = new Hono<HonoConfig>()
  .get("/conversations", async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const user = session?.user;
    if (!user) return c.json({ data: [] }, 401);

    const result = await getConversations(db, user.id);
    return c.json(result, 200);
  })
  .post("/conversations", async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const user = session?.user;
    if (!user) return c.json({ message: "No autorizado" }, 401);

    const body = await c.req.json<{ title?: string }>().catch(() => ({}) as { title?: string });
    const result = await createConversation(db, user.id, body.title);
    return c.json(result, 201);
  })
  .get("/conversations/:id/messages", async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");

    const result = await getMessages(db, id);
    return c.json(result, 200);
  })
  .delete("/conversations/:id", async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const user = session?.user;
    if (!user) return c.json({ message: "No autorizado" }, 401);

    const id = c.req.param("id");
    const result = await deleteConversation(db, id, user.id);
    return c.json(result, 200);
  });

export default aiRouter;
