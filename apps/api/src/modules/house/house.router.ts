import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HouseHandler } from "./house.handler";
import { createHouseDto } from "./dto/create-house.dto";
import { HonoConfig } from "../../index";

const houseHandler = new HouseHandler();
const housesRouter = new Hono<HonoConfig>();

housesRouter.post("/", zValidator("json", createHouseDto), async (c) => {
  const data = c.req.valid("json");
  const db = c.get('db');
  
  const result = await houseHandler.create(db, data);
  
  return c.json(result, 201);
});

export default housesRouter;