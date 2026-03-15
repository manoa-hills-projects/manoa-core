import { Hono } from "hono";
import type { HonoConfig } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { findAllLaws, findOneLaw, triggerScrape, searchLaws } from "./laws.handler";
import { lawsQueryDto, lawsSearchDto } from "./dto";

const lawsRouter = new Hono<HonoConfig>()
	.get("/", zValidator("query", lawsQueryDto), async (c) => {
		const db = c.get("db");
		const query = c.req.valid("query");
		const result = await findAllLaws(db, query);
		return c.json(result, 200);
	})
	.get("/search", zValidator("query", lawsSearchDto), async (c) => {
		const db = c.get("db");
		const { q } = c.req.valid("query");
		const result = await searchLaws(db, q);
		return c.json(result, 200);
	})
	.get("/:id", async (c) => {
		const db = c.get("db");
		const id = c.req.param("id");
		const result = await findOneLaw(db, id);
		if (!result.data) return c.json({ error: "Ley no encontrada" }, 404);
		return c.json(result, 200);
	})
	.post("/scrape", async (c) => {
		const db = c.get("db");
		const env = c.env;
		const accountId = await (typeof env.CF_ACCOUNT_ID === "string"
			? Promise.resolve(env.CF_ACCOUNT_ID)
			: env.CF_ACCOUNT_ID.get());
		const apiToken = await (typeof env.CF_BR_API_TOKEN === "string"
			? Promise.resolve(env.CF_BR_API_TOKEN)
			: env.CF_BR_API_TOKEN.get());

		const result = await triggerScrape(db, accountId, apiToken);
		return c.json(result, 200);
	});

export default lawsRouter;
