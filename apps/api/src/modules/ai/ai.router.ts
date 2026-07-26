import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { streamText } from "ai";
import { drizzle } from "drizzle-orm/d1";
import type { HonoConfig } from "../../index";
import { getConversations, getMessages, createConversation, deleteConversation } from "./ai.handler";
import { getUserPermissions } from "@/shared/utils/permissions.middleware";
import * as schema from "@/shared/database/schemas";
import { buildTools, SYSTEM_PROMPT } from "./chat-agent";

const chatSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
  conversationId: z.string().optional(),
});

const aiRouter = new Hono<HonoConfig>()

  // ── REST chat endpoint (sin WebSocket, para popover) ──
  .post("/chat", zValidator("json", chatSchema), async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const { messages, conversationId } = c.req.valid("json");
    const tools = buildTools(db);

    const result = streamText({
      model: c.env.AI as any,
      system: SYSTEM_PROMPT,
      messages: messages as any,
      tools,
      stopWhen: stepCountIs(3),
    });

    return result.toUIMessageStreamResponse();
  })

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
    const session = c.get("session");
    const user = session?.user;
    const id = c.req.param("id");

    if (!user) return c.json({ message: "No autorizado" }, 401);

    const userPerms = await getUserPermissions(db, c.env.PERMISSIONS_CACHE, user.id);
    const isSuperAdmin = userPerms?.bypassesRbac;

    const result = await getMessages(db, id, isSuperAdmin ? undefined : user.id);
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
