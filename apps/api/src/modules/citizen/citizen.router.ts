import { Hono } from "hono";
import type { HonoConfig } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { createCitizen, findAllCitizens, updateCitizen, findOneCitizen } from "./citizen.handler";
import { createCitizenDto, updateCitizenDto, citizenQueryDto } from "./dto";

const citizensRouter = new Hono<HonoConfig>()

.post("/", zValidator("json", createCitizenDto), async (c) => {
  const data = c.req.valid("json");
  const db = c.get('db');
  
  const result = await createCitizen(db, data);
  
  return c.json(result, 201);
})
.get("/", zValidator("query", citizenQueryDto), async (c) => {
  const db = c.get('db');
  const query = c.req.valid("query");

  const result = await findAllCitizens(db, query);

  return c.json(result, 200);
})
.get("/:id", async (c) => {
  const db = c.get('db');
  const id = c.req.param("id");

  const result = await findOneCitizen(db, id);

  return c.json(result, 200);
})
.patch("/:id", zValidator("json", updateCitizenDto), async (c) => {
  const data = c.req.valid("json");
  const db = c.get('db');
  const id = c.req.param("id");

  const result = await updateCitizen(db, id, data);

  return c.json(result, 200);
});

export default citizensRouter;
