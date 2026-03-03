import { Hono } from "hono";
import type { HonoConfig } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { createFamily, findAllFamilies, updateFamily, findOneFamily, deleteFamily } from "./family.handler";
import { createFamilyDto, updateFamilyDto, familyQueryDto } from "./dto";

const familiesRouter = new Hono<HonoConfig>()

.post("/", zValidator("json", createFamilyDto), async (c) => {
  const data = c.req.valid("json");
  const db = c.get('db');
  
  const result = await createFamily(db, data);
  
  return c.json(result, 201);
})
.get("/", zValidator("query", familyQueryDto), async (c) => {
  const db = c.get('db');
  const query = c.req.valid("query");

  const result = await findAllFamilies(db, query);

  return c.json(result, 200);
})
.get("/:id", async (c) => {
  const db = c.get('db');
  const id = c.req.param("id");

  const result = await findOneFamily(db, id);

  return c.json(result, 200);
})
.patch("/:id", zValidator("json", updateFamilyDto), async (c) => {
  const data = c.req.valid("json");
  const db = c.get('db');
  const id = c.req.param("id");

  const result = await updateFamily(db, id, data);

  return c.json(result, 200);
})
.delete("/:id", async (c) => {
  const db = c.get('db');
  const id = c.req.param("id");

  const result = await deleteFamily(db, id);

  return c.json(result, 200);
});

export default familiesRouter;
