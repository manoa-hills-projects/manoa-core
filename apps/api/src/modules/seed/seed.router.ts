import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { user as userTable } from "../../shared/database/schemas/auth.schema";
import { drizzle } from "drizzle-orm/d1";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const seedRouter = new Hono();

seedRouter.use("/*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type");
  if (c.req.method === "OPTIONS") {
    return c.text("", 204);
  }
  await next();
});

seedRouter.post("/seed-superadmin", async (c) => {
  const db = drizzle(c.env.DB, { schema: { user: userTable } });
  const users = await db.select().from(userTable).limit(1);
  if (users.length > 0) {
    return c.json({ error: "Already seeded" }, 409);
  }
  const { email, password, name } = await c.req.json();
  const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "d1", schema: { user: userTable } }),
    emailAndPassword: { enabled: true },
    secret: c.env.BETTER_AUTH_SECRET,
    baseURL: c.env.BETTER_AUTH_URL,
  });
  const newUser = await auth.api.createUser({
    body: {
      email,
      password,
      name,
      role: "superadmin",
    },
  });
  return c.json({ ok: true, user: newUser });
});
