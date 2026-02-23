import * as schema from "@/shared/database/schemas"
import { DrizzleD1Database } from "drizzle-orm/d1";
import { count, eq, ilike, } from "drizzle-orm";
import { buildPaginatedData, buildSingleData } from "@/shared/utils/api-reponse";
import { HouseQueryParams } from "./dto";
import { sql } from "drizzle-orm";

export const createHouse = async (db: DrizzleD1Database<typeof schema>, data: typeof schema.houses.$inferInsert) => {
  const [result] = await db.insert(schema.houses).values(data).returning();

  return buildSingleData(result ?? null)
}

export const findOneHouse = async (db: DrizzleD1Database<typeof schema>, id: string) => {
  const result = await db.select().from(schema.houses).where(eq(schema.houses.id, id)).get();
  return { data: result ?? null };
}

export const findAllHouses = async (
  db: DrizzleD1Database<typeof schema>,
  queryParams: HouseQueryParams
) => {
  const { limit, page, search } = queryParams;

  const query = db.select().from(schema.houses);

  if (search) query.where(
    sql`LOWER(${schema.houses.address}) LIKE ${`%${search.toLowerCase()}%`}`
  );


  const [rows, [{ total }]] = await Promise.all([
    query.limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(schema.houses),
  ]);

  return buildPaginatedData(rows, total, page, limit);
};
