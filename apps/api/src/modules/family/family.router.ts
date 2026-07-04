import { Hono } from "hono";
import type { HonoConfig } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { createFamily, findAllFamilies, updateFamily, findOneFamily, deleteFamily } from "./family.handler";
import { createFamilyDto, updateFamilyDto, familyQueryDto } from "./dto";
import { requirePermission, getUserPermissions } from "../../shared/utils/permissions.middleware";
import { MODULES } from "../../shared/constants";
import { SYSTEM_PROFILES } from "../../shared/constants/profiles";

const familiesRouter = new Hono<HonoConfig>()

.post("/", requirePermission(MODULES.FAMILIES), zValidator("json", createFamilyDto), async (c) => {
  const data = c.req.valid("json");
  const db = c.get('db');
  
  const result = await createFamily(db, data);
  
  return c.json(result, 201);
})
.get("/", zValidator("query", familyQueryDto), async (c) => {
  const db = c.get('db');
  const session = c.get('session');
  const query = c.req.valid("query");

  // If mine=true, require auth and filter by ownership
  if (query.mine) {
    if (!session?.user) {
      return c.json({ error: "No autorizado" }, 401);
    }
    const result = await findAllFamilies(db, query, session.user.id);
    return c.json(result, 200);
  }

  const result = await findAllFamilies(db, query);

  return c.json(result, 200);
})
.get("/:id", async (c) => {
  const db = c.get('db');
  const session = c.get('session');
  const id = c.req.param("id");

  if (!session?.user) {
    return c.json({ error: "No autorizado" }, 401);
  }

  const result = await findOneFamily(db, id);

  if (!result.data) {
    return c.json({ error: "No encontrado" }, 404);
  }

  const family = result.data;

  // Allow super_admin to view any family
  const userPerms = await getUserPermissions(db, c.env.PERMISSIONS_CACHE, session.user.id);
  if (userPerms?.profileKey === SYSTEM_PROFILES.SUPER_ADMIN) {
    return c.json(result, 200);
  }

  // Ownership check: user must have a citizen in this family
  const { citizens } = await import("@/shared/database/schemas");
  const { eq, and } = await import("drizzle-orm");

  const citizenInFamily = await db
    .select({ id: citizens.id })
    .from(citizens)
    .where(
      and(
        eq(citizens.userId, session.user.id),
        eq(citizens.familyId, id)
      )
    )
    .get();

  if (!citizenInFamily) {
    return c.json({ error: "No encontrado" }, 404);
  }

  return c.json(result, 200);
})
.patch("/:id", requirePermission(MODULES.FAMILIES), zValidator("json", updateFamilyDto), async (c) => {
  const data = c.req.valid("json");
  const db = c.get('db');
  const id = c.req.param("id");

  const result = await updateFamily(db, id, data);

  return c.json(result, 200);
})
.delete("/:id", requirePermission(MODULES.FAMILIES), async (c) => {
  const db = c.get('db');
  const id = c.req.param("id");

  const result = await deleteFamily(db, id);

  return c.json(result, 200);
});

export default familiesRouter;
