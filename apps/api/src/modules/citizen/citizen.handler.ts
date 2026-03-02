import * as schema from "@/shared/database/schemas"
import { DrizzleD1Database } from "drizzle-orm/d1";
import { count, eq, sql } from "drizzle-orm";
import { buildPaginatedData, buildSingleData } from "@/shared/utils/api-reponse";
import { CitizenQueryParams } from "./dto";

export const createCitizen = async (db: DrizzleD1Database<typeof schema>, data: typeof schema.citizens.$inferInsert) => {
  const [result] = await db.insert(schema.citizens).values(data).returning();
  return buildSingleData(result ?? null);
}

export const findOneCitizen = async (db: DrizzleD1Database<typeof schema>, id: string) => {
  const result = await db.select().from(schema.citizens).where(eq(schema.citizens.id, id)).get();
  return { data: result ?? null };
}

export const findAllCitizens = async (db: DrizzleD1Database<typeof schema>, queryParams: CitizenQueryParams) => {
  const { limit, page, search } = queryParams;

  const query = db.select().from(schema.citizens);

  if (search) {
    query.where(sql`LOWER(${schema.citizens.cedula}) LIKE ${`%${search.toLowerCase()}%`}`);
  }

  const [rows, [{ total }]] = await Promise.all([
    query.limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(schema.citizens),
  ]);

  return buildPaginatedData(rows, total, page, limit);
};

export const updateCitizen = async (
  db: DrizzleD1Database<typeof schema>,
  id: string,
  data: Partial<typeof schema.citizens.$inferInsert>
) => {
  const [result] = await db.update(schema.citizens).set(data).where(eq(schema.citizens.id, id)).returning();
  return buildSingleData(result ?? null);
};
