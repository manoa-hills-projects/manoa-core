import * as schema from "@/shared/database/schemas"
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { count, eq, sql, and } from "drizzle-orm";
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
  user_id: citizen.userId,
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
      userId: data.user_id,
    })
    .returning();

  return buildSingleData(result ? toCitizenResponse(result) : null);
}

export const findOneCitizen = async (db: DrizzleD1Database<typeof schema>, id: string) => {
  const result = await db.select().from(schema.citizens).where(eq(schema.citizens.id, id)).get();
  return { data: result ? toCitizenResponse(result) : null };
}

export const findAllCitizens = async (db: DrizzleD1Database<typeof schema>, queryParams: CitizenQueryParams) => {
  const { limit, page, search, family_id, user_id } = queryParams;

  const query = db
    .select({
      id: schema.citizens.id,
      dni: schema.citizens.dni,
      firstName: schema.citizens.firstName,
      lastName: schema.citizens.lastName,
      birthDate: schema.citizens.birthDate,
      gender: schema.citizens.gender,
      isHeadOfHousehold: schema.citizens.isHeadOfHousehold,
      familyId: schema.citizens.familyId,
      userId: schema.citizens.userId,
      familyName: schema.families.name,
      houseAddress: schema.houses.address,
      houseSector: schema.houses.sector,
      houseNumber: schema.houses.number,
    })
    .from(schema.citizens)
    .leftJoin(schema.families, eq(schema.families.id, schema.citizens.familyId))
    .leftJoin(schema.houses, eq(schema.houses.id, schema.families.houseId));

  const conditions = [];

  if (search) {
    conditions.push(
      sql`LOWER(${schema.citizens.dni}) LIKE ${`%${search.toLowerCase()}%`} OR LOWER(${schema.citizens.firstName}) LIKE ${`%${search.toLowerCase()}%`} OR LOWER(${schema.citizens.lastName}) LIKE ${`%${search.toLowerCase()}%`}`
    );
  }

  if (family_id) {
    conditions.push(eq(schema.citizens.familyId, family_id));
  }

  if (user_id) {
    conditions.push(eq(schema.citizens.userId, user_id));
  }

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  const [rows, [{ total }]] = await Promise.all([
    query.limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(schema.citizens),
  ]);

  const data = rows.map((row) => ({
    id: row.id,
    cedula: row.dni,
    names: row.firstName,
    surnames: row.lastName,
    birth_date: row.birthDate,
    gender: row.gender,
    is_head_of_household: row.isHeadOfHousehold,
    family_id: row.familyId,
    user_id: row.userId,
    family_label: row.familyName,
    house_label: (!row.houseAddress && !row.houseSector && !row.houseNumber) ? null :
      [row.houseSector, row.houseNumber, row.houseAddress].filter(Boolean).join(" · "),
  }));

  return buildPaginatedData(data, total, page, limit);
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
  if (data.user_id !== undefined) updateData.userId = data.user_id;

  const [result] = await db
    .update(schema.citizens)
    .set(updateData)
    .where(eq(schema.citizens.id, id))
    .returning();

  return buildSingleData(result ? toCitizenResponse(result) : null);
};
export const deleteCitizen = async (
  db: DrizzleD1Database<typeof schema>,
  id: string,
) => {
  await db.delete(schema.citizens).where(eq(schema.citizens.id, id)).run();
  return { message: "Ciudadano eliminado correctamente" };
};
