import { createHouseDto } from "./dto/create-house.dto";
import { updateHouseDto } from "./dto/update-house.dto";
import { Hono } from "hono";
import type { HonoConfig } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { createHouse, findAllHouses, findOneHouse, isHouseOwner, updateHouse, deleteHouse } from "./house.handler";
import { houseQueryDto } from "./dto/find-all-houses.dto";
import { getUserPermissions, requirePermission } from "@/shared/utils/permissions.middleware";
import { MODULES } from "@/shared/constants";

const housesRouter = new Hono<HonoConfig>()

.post("/", requirePermission(MODULES.HOUSES), zValidator("json", createHouseDto), async (c) => {
  const data = c.req.valid("json");
  const db = c.get('db');
  
  const result = await createHouse(db, data);
  
  return c.json(result, 201);
})
.get("/", zValidator("query", houseQueryDto), async (c) => {
  const db = c.get('db');
  const session = c.get("session");
  const query = c.req.valid("query");

  // If mine=true, require authentication
  if (query.mine === "true" && !session?.user) {
    return c.json({ error: "No autorizado" }, 401);
  }

  const userId = session?.user?.id ?? undefined;
  const result = await findAllHouses(db, query, userId);

  return c.json(result, 200);
})
.get("/:id", async (c) => {
  const db = c.get('db');
  const session = c.get("session");
  const id = c.req.param("id");

  if (!session?.user) {
    return c.json({ error: "No autorizado" }, 401);
  }

  const userId = session.user.id;

  // Fetch the house
  const { data: house } = await findOneHouse(db, id);

  if (!house) {
    return c.json({ error: "No encontrado" }, 404);
  }

  // Super admin has access to all houses
  const userPerms = await getUserPermissions(db, c.env.PERMISSIONS_CACHE, userId);
  const isSuperAdmin = userPerms?.bypassesRbac;

  if (isSuperAdmin) {
    return c.json({ data: house }, 200);
  }

  // Ownership check: user must be a member of the family that owns this house
  // Chain: citizens.userId -> citizens.familyId -> families.houseId -> houses.id
  const ownerCheck = await isHouseOwner(db, userId, id);

  if (!ownerCheck) {
    return c.json({ error: "No encontrado" }, 404);
  }

  return c.json({ data: house }, 200);
})
.patch("/:id", requirePermission(MODULES.HOUSES), zValidator("json", updateHouseDto), async (c) => {
  const data = c.req.valid("json");
  const db = c.get('db');
  const id = c.req.param("id");

  const result = await updateHouse(db, id, data);

  return c.json(result, 200);
})
.delete("/:id", requirePermission(MODULES.HOUSES), async (c) => {
  const db = c.get('db');
  const id = c.req.param("id");

  const result = await deleteHouse(db, id);

  return c.json(result, 200);
});

export default housesRouter;
