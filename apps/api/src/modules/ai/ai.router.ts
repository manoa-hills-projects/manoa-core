import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { HonoConfig } from "../../index";
import { queryAssistant } from "./ai.handler";
import { queryAiDto } from "./dto/query-ai.dto";

const aiRouter = new Hono<HonoConfig>().post(
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
);

export default aiRouter;

