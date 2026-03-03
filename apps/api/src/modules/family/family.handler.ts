import * as schema from "@/shared/database/schemas"
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { count, eq } from "drizzle-orm";
import { buildPaginatedData, buildSingleData } from "@/shared/utils/api-reponse";
import type { createFamilyInput, FamilyQueryParams, updateFamilyInput } from "./dto";
import { sql } from "drizzle-orm";

const toFamilyResponse = (family: typeof schema.families.$inferSelect) => ({
  id: family.id,
  family_name: family.name,
  house_id: family.houseId,
  head_of_household_id: family.headId,
});

const formatHouseLabel = (house: {
  sector: string | null;
  number: string | null;
  address: string | null;
}) => {
  if (!house.address && !house.sector && !house.number) return null;

  return [house.sector, house.number, house.address].filter(Boolean).join(" · ");
};

const formatHeadOfHouseholdLabel = (head: {
  firstName: string | null;
  lastName: string | null;
  dni: string | null;
}) => {
  const fullName = [head.firstName, head.lastName].filter(Boolean).join(" ").trim();

  if (!fullName && !head.dni) return null;

  if (fullName && head.dni) return `${fullName} · ${head.dni}`;

  return fullName || head.dni;
};

export const createFamily = async (
  db: DrizzleD1Database<typeof schema>,
  data: createFamilyInput,
) => {
  const [result] = await db
    .insert(schema.families)
    .values({
      name: data.family_name,
      houseId: data.house_id,
      headId: data.head_of_household_id ?? null,
    })
    .returning();

  return buildSingleData(result ? toFamilyResponse(result) : null);
}

export const findOneFamily = async (db: DrizzleD1Database<typeof schema>, id: string) => {
  const result = await db.select().from(schema.families).where(eq(schema.families.id, id)).get();
  return { data: result ? toFamilyResponse(result) : null };
}

export const findAllFamilies = async (db: DrizzleD1Database<typeof schema>, queryParams: FamilyQueryParams) => {
  const { limit, page, search } = queryParams;

  const query = db
    .select({
      id: schema.families.id,
      name: schema.families.name,
      houseId: schema.families.houseId,
      headId: schema.families.headId,
      houseAddress: schema.houses.address,
      houseSector: schema.houses.sector,
      houseNumber: schema.houses.number,
      headFirstName: schema.citizens.firstName,
      headLastName: schema.citizens.lastName,
      headDni: schema.citizens.dni,
    })
    .from(schema.families)
    .leftJoin(schema.houses, eq(schema.houses.id, schema.families.houseId))
    .leftJoin(schema.citizens, eq(schema.citizens.id, schema.families.headId));

  if (search) {
    query.where(sql`LOWER(${schema.families.name}) LIKE ${`%${search.toLowerCase()}%`}`);
  }

  const [rows, [{ total }]] = await Promise.all([
    query.limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(schema.families),
  ]);

  const data = rows.map((row) => ({
    id: row.id,
    family_name: row.name,
    house_id: row.houseId,
    head_of_household_id: row.headId,
    head_of_household_label: formatHeadOfHouseholdLabel({
      firstName: row.headFirstName,
      lastName: row.headLastName,
      dni: row.headDni,
    }),
    house_label: formatHouseLabel({
      address: row.houseAddress,
      sector: row.houseSector,
      number: row.houseNumber,
    }),
  }));

  return buildPaginatedData(data, total, page, limit);
};

export const updateFamily = async (
  db: DrizzleD1Database<typeof schema>,
  id: string,
  data: updateFamilyInput,
) => {
  const updateData: Partial<typeof schema.families.$inferInsert> = {};

  if (data.family_name !== undefined) updateData.name = data.family_name;
  if (data.house_id !== undefined) updateData.houseId = data.house_id;
  if (data.head_of_household_id !== undefined) {
    updateData.headId = data.head_of_household_id;
  }

  const [result] = await db
    .update(schema.families)
    .set(updateData)
    .where(eq(schema.families.id, id))
    .returning();

  return buildSingleData(result ? toFamilyResponse(result) : null);
};
export const deleteFamily = async (
  db: DrizzleD1Database<typeof schema>,
  id: string,
) => {
  await db.delete(schema.families).where(eq(schema.families.id, id)).run();
  return { message: "Familia eliminada correctamente" };
};
