import * as schema from "@/shared/database/schemas"
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { count, eq, sql } from "drizzle-orm";
import { buildPaginatedData, buildSingleData } from "@/shared/utils/api-reponse";
import type { CitizenQueryParams, createCitizenInput, updateCitizenInput } from "./dto";

const toCitizenResponse = (citizen: typeof schema.citizens.$inferSelect) => ({
  id: citizen.id,
  cedula: citizen.dni,
  names: citizen.firstName,
  surnames: citizen.lastName,
  birth_date: citizen.birthDate,
  gender: citizen.gender,
  is_head_of_household: citizen.isHeadOfHousehold,
  family_id: citizen.familyId,
});

export const createCitizen = async (
  db: DrizzleD1Database<typeof schema>,
  data: createCitizenInput,
) => {
  const [result] = await db
    .insert(schema.citizens)
    .values({
      dni: data.cedula,
      firstName: data.names,
      lastName: data.surnames,
      birthDate: data.birth_date,
      gender: data.gender,
      isHeadOfHousehold: data.is_head_of_household,
      familyId: data.family_id,
    })
    .returning();

  return buildSingleData(result ? toCitizenResponse(result) : null);
}

export const findOneCitizen = async (db: DrizzleD1Database<typeof schema>, id: string) => {
  const result = await db.select().from(schema.citizens).where(eq(schema.citizens.id, id)).get();
  return { data: result ? toCitizenResponse(result) : null };
}

export const findAllCitizens = async (db: DrizzleD1Database<typeof schema>, queryParams: CitizenQueryParams) => {
  const { limit, page, search } = queryParams;

  const query = db.select().from(schema.citizens);

  if (search) {
    query.where(
      sql`LOWER(${schema.citizens.dni}) LIKE ${`%${search.toLowerCase()}%`} OR LOWER(${schema.citizens.firstName}) LIKE ${`%${search.toLowerCase()}%`} OR LOWER(${schema.citizens.lastName}) LIKE ${`%${search.toLowerCase()}%`}`,
    );
  }

  const [rows, [{ total }]] = await Promise.all([
    query.limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(schema.citizens),
  ]);

  return buildPaginatedData(rows.map(toCitizenResponse), total, page, limit);
};

export const updateCitizen = async (
  db: DrizzleD1Database<typeof schema>,
  id: string,
  data: updateCitizenInput,
) => {
  const updateData: Partial<typeof schema.citizens.$inferInsert> = {};

  if (data.cedula !== undefined) updateData.dni = data.cedula;
  if (data.names !== undefined) updateData.firstName = data.names;
  if (data.surnames !== undefined) updateData.lastName = data.surnames;
  if (data.birth_date !== undefined) updateData.birthDate = data.birth_date;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.is_head_of_household !== undefined) {
    updateData.isHeadOfHousehold = data.is_head_of_household;
  }
  if (data.family_id !== undefined) updateData.familyId = data.family_id;

  const [result] = await db
    .update(schema.citizens)
    .set(updateData)
    .where(eq(schema.citizens.id, id))
    .returning();

  return buildSingleData(result ? toCitizenResponse(result) : null);
};
