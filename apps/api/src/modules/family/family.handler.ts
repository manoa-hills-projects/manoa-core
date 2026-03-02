import * as schema from "@/shared/database/schemas"
import { DrizzleD1Database } from "drizzle-orm/d1";
import { count, eq } from "drizzle-orm";
import { buildPaginatedData, buildSingleData } from "@/shared/utils/api-reponse";
import { FamilyQueryParams } from "./dto";
import { sql } from "drizzle-orm";

export const createFamily = async (db: DrizzleD1Database<typeof schema>, data: typeof schema.families.$inferInsert) => {
  const [result] = await db.insert(schema.families).values(data).returning();
  return buildSingleData(result ?? null);
}

export const findOneFamily = async (db: DrizzleD1Database<typeof schema>, id: string) => {
  const result = await db.select().from(schema.families).where(eq(schema.families.id, id)).get();
  return { data: result ?? null };
}

export const findAllFamilies = async (db: DrizzleD1Database<typeof schema>, queryParams: FamilyQueryParams) => {
  const { limit, page, search } = queryParams;

  const query = db.select().from(schema.families);

  if (search) {
    query.where(sql`LOWER(${schema.families.family_name}) LIKE ${`%${search.toLowerCase()}%`}`);
  }

  const [rows, [{ total }]] = await Promise.all([
    query.limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(schema.families),
  ]);

  return buildPaginatedData(rows, total, page, limit);
};

export const updateFamily = async (
  db: DrizzleD1Database<typeof schema>,
  id: string,
  data: Partial<typeof schema.families.$inferInsert>
) => {
  const [result] = await db.update(schema.families).set(data).where(eq(schema.families.id, id)).returning();
  return buildSingleData(result ?? null);
};
