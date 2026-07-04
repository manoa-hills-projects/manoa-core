import * as schema from "@/shared/database/schemas"
import { DrizzleD1Database } from "drizzle-orm/d1";
import { count, countDistinct, desc, eq, ilike, } from "drizzle-orm";
import { buildPaginatedData, buildSingleData } from "@/shared/utils/api-reponse";
import { HouseQueryParams } from "./dto";
import { sql } from "drizzle-orm";

/**
 * Checks if a user owns or is a member of the family that owns a house.
 * Ownership chain: citizens.userId -> citizens.familyId -> families.houseId -> houses.id
 *
 * @param db - Database instance
 * @param userId - ID of the user to check
 * @param houseId - ID of the house to verify ownership for
 * @returns true if user has ownership via family membership, false otherwise
 */
export const isHouseOwner = async (
  db: DrizzleD1Database<typeof schema>,
  userId: string,
  houseId: string
): Promise<boolean> => {
  // Find the citizen record for this user
  const citizen = await db
    .select()
    .from(schema.citizens)
    .where(eq(schema.citizens.userId, userId))
    .get();

  if (!citizen?.familyId) {
    return false;
  }

  // Find the family this citizen belongs to
  const family = await db
    .select()
    .from(schema.families)
    .where(eq(schema.families.id, citizen.familyId))
    .get();

  if (!family?.houseId) {
    return false;
  }

  // Check if the family's house matches the requested house
  return family.houseId === houseId;
};

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
  queryParams: HouseQueryParams,
  userId?: string
) => {
  const { limit, page, search, mine } = queryParams;

  // If mine=true, userId is required for ownership check
  if (mine === "true" && !userId) {
    return buildPaginatedData([], 0, page, limit);
  }

  // Public listing (Zona 1): no mine param or mine=false
  // Returns limited fields without sensitive location data
  if (mine !== "true") {
    let query = db
      .select({
        id: schema.houses.id,
        address: schema.houses.address,
        sector: schema.houses.sector,
        number: schema.houses.number,
        createdAt: schema.houses.createdAt,
      })
      .from(schema.houses);

    if (search) query.where(
      sql`LOWER(${schema.houses.address}) LIKE ${`%${search.toLowerCase()}%`}`
    );

    const [rows, [{ total }]] = await Promise.all([
      query.limit(limit).offset((page - 1) * limit),
      db.select({ total: count() }).from(schema.houses),
    ]);

    return buildPaginatedData(rows, total, page, limit);
  }

  // Ownership filtering (Zona 2): mine=true
  // Find houses where user is member of owning family
  const citizen = await db
    .select()
    .from(schema.citizens)
    .where(eq(schema.citizens.userId, userId!))
    .get();

  if (!citizen?.familyId) {
    return buildPaginatedData([], 0, page, limit);
  }

  // Find families belonging to user's family that have a house
  const familiesWithHouse = await db
    .select({ houseId: schema.families.houseId })
    .from(schema.families)
    .where(eq(schema.families.id, citizen.familyId));

  const houseIds = familiesWithHouse
    .map(f => f.houseId)
    .filter((id): id is string => id !== null);

  if (houseIds.length === 0) {
    return buildPaginatedData([], 0, page, limit);
  }

  // Get total count first
  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.houses)
    .where(sql`${schema.houses.id} IN ${houseIds}`);

  // Fetch houses with pagination
  const rows = await db
    .select()
    .from(schema.houses)
    .where(sql`${schema.houses.id} IN ${houseIds}`)
    .limit(limit)
    .offset((page - 1) * limit);

  return buildPaginatedData(rows, total, page, limit);
};

export const updateHouse = async (
  db: DrizzleD1Database<typeof schema>,
  id: string,
  data: Partial<typeof schema.houses.$inferInsert>
) => {
  const [result] = await db.update(schema.houses).set(data).where(eq(schema.houses.id, id)).returning();
  return buildSingleData(result ?? null);
};
export const deleteHouse = async (
  db: DrizzleD1Database<typeof schema>,
  id: string,
) => {
  await db.delete(schema.houses).where(eq(schema.houses.id, id)).run();
  return { message: "Casa eliminada correctamente" };
};

export const houseStats = async (db: DrizzleD1Database<typeof schema>) => {
  const totalHouses = await db.select({ total: count() }).from(schema.houses).get();
  

  const uniqueSectorsCount = await db
    .select({ count: countDistinct(schema.houses.sector) })
    .from(schema.houses)
    .get();

  const latestHouse = await db
    .select()
    .from(schema.houses)
    .orderBy(desc(schema.houses.createdAt))
    .limit(1)
    .get();
  
  return { 
    total: totalHouses?.total ?? 0, 
    uniqueSectors: uniqueSectorsCount?.count ?? 0, 
    latestHouse 
  };
}
