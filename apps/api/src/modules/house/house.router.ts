import { createHouseDto } from "./dto/create-house.dto";
import { Hono } from "hono";
import type { HonoConfig } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { createHouse, findAllHouses } from "./house.handler";

const housesRouter = new Hono<HonoConfig>()

.post("/", zValidator("json", createHouseDto), async (c) => {
  const data = c.req.valid("json");
  const db = c.get('db');
  
  const result = await createHouse(db, data);
  
  return c.json(result, 201);
})
.get("/", async (c) => {
  const db = c.get('db');

  const result = await findAllHouses(db);

  return c.json(result, 200);
});

export default housesRouter;