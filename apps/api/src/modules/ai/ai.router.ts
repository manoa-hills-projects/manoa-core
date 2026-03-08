import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { HonoConfig } from "../../index";
import { queryAssistant, getConversations, getMessages, chatAssistant } from "./ai.handler";
import { queryAiDto } from "./dto/query-ai.dto";
import { chatDto } from "./dto/chat.dto";

const aiRouter = new Hono<HonoConfig>()
  .post(
    "/query",
    zValidator("json", queryAiDto),
    async (c) => {
      const db = c.get("db");
      const data = c.req.valid("json");

      const result = await queryAssistant(db, data, {
        ai: c.env.AI,
        model: c.env.AI_MODEL ?? "@cf/meta/llama-3.1-8b-instruct",
      });

      return c.json(result, 200);
    },
  )
  .get("/conversations", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    if (!user) return c.json({ data: [] }, 401);

    const result = await getConversations(db, user.id);
    return c.json(result, 200);
  })
  .get("/conversations/:id/messages", async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");

    const result = await getMessages(db, id);
    return c.json(result, 200);
  })
  .post("/chat", zValidator("json", chatDto), async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    if (!user) return c.json({ error: "No autorizado" }, 401);

    const data = c.req.valid("json");

    const result = await chatAssistant(db, user.id, data, {
      ai: c.env.AI,
      model: c.env.AI_MODEL ?? "@cf/meta/llama-3.1-8b-instruct",
    });

    return c.json(result, 200);
  });

export default aiRouter;

