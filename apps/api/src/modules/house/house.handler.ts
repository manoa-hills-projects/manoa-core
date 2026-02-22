import * as schema from "@/shared/database/schemas"
import { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";

export const createHouse = async (db: DrizzleD1Database<typeof schema>, data: typeof schema.houses.$inferInsert) => {
  const [result] = await db.insert(schema.houses).values(data).returning();
  return { data: result };
}

export const findOneHouse = async (db: DrizzleD1Database<typeof schema>, id: string) => {
  const result = await db.select().from(schema.houses).where(eq(schema.houses.id, id)).get();
  return { data: result ?? null };
}

export const findAllHouses = async (db: DrizzleD1Database<typeof schema>) => {
  const result = await db.select().from(schema.houses);
  return { data: result };
}
