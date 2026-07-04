import { Hono } from "hono";
import type { HonoConfig } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { createCitizen, findAllCitizens, updateCitizen, findOneCitizen, deleteCitizen } from "./citizen.handler";
import { createCitizenDto, updateCitizenDto, citizenQueryDto } from "./dto";
import { requirePermission, getUserPermissions } from "../../shared/utils/permissions.middleware";
import { MODULES } from "../../shared/constants";
import { SYSTEM_PROFILES } from "../../shared/constants/profiles";

const citizensRouter = new Hono<HonoConfig>()

.post("/", requirePermission(MODULES.CITIZENS), zValidator("json", createCitizenDto), async (c) => {
  const data = c.req.valid("json");
  const db = c.get('db');

  const result = await createCitizen(db, data);

  return c.json(result, 201);
})
.get("/", zValidator("query", citizenQueryDto), async (c) => {
  const db = c.get('db');
  const session = c.get('session');
  const query = c.req.valid("query");

  // Zone 2: ?mine=true requires auth and returns only user's citizen record
  if (query.mine === "true") {
    if (!session?.user) {
      return c.json({ error: "No autorizado" }, 401);
    }
    // Override user_id filter to only show the authenticated user's citizen
    const result = await findAllCitizens(db, { ...query, user_id: session.user.id });
    return c.json(result, 200);
  }

  // Zone 1: Public listing - no auth required, returns limited fields
  const result = await findAllCitizens(db, query);
  return c.json(result, 200);
})
.get("/:id", async (c) => {
  const db = c.get('db');
  const session = c.get('session');
  const id = c.req.param("id");

  if (!session?.user) {
    return c.json({ error: "No autorizado" }, 401);
  }

  // Ownership check: fetch citizen first
  const result = await findOneCitizen(db, id);

  if (!result.data) {
    return c.json({ error: "No encontrado" }, 404);
  }

  const citizen = result.data;

  // Allow if user owns this record
  if (citizen.user_id === session.user.id) {
    return c.json(result, 200);
  }

  // Allow super_admin to view any citizen
  const userPerms = await getUserPermissions(db, c.env.PERMISSIONS_CACHE, session.user.id);
  if (userPerms?.profileKey === SYSTEM_PROFILES.SUPER_ADMIN) {
    return c.json(result, 200);
  }

  // Deny access - return 404 to not leak existence
  return c.json({ error: "No encontrado" }, 404);
})
.patch("/:id", requirePermission(MODULES.CITIZENS), zValidator("json", updateCitizenDto), async (c) => {
  const data = c.req.valid("json");
  const db = c.get('db');
  const id = c.req.param("id");

  const result = await updateCitizen(db, id, data);

  return c.json(result, 200);
})
.delete("/:id", requirePermission(MODULES.CITIZENS), async (c) => {
  const db = c.get('db');
  const id = c.req.param("id");

  const result = await deleteCitizen(db, id);

  return c.json(result, 200);
});

export default citizensRouter;
