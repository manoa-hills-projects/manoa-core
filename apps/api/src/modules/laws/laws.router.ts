import { Hono } from "hono";
import type { HonoConfig } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { findAllLaws, findOneLaw, searchLaws } from "./laws.handler";
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
		const env = c.env;
		await env.LAWS_SCRAPE_QUEUE.send({ type: "scrape_laws" });
		return c.json({ message: "Sincronización encolada. El proceso se ejecutará en segundo plano." }, 202);
	});

export default lawsRouter;
