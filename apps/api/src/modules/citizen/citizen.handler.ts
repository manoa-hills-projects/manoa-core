import type { drizzle as drizzleType } from "drizzle-orm/d1";
import * as schema from "@/shared/database/schemas"
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { count, eq, sql, and, inArray } from "drizzle-orm";
import { buildPaginatedData, buildSingleData } from "@/shared/utils/api-reponse";
import type { CitizenQueryParams, createCitizenInput, updateCitizenInput } from "./dto";


// ── Helpers ──────────────────────────────────────────

const fetchDisabilities = async (db: DrizzleD1Database<typeof schema>, citizenId: string) => {
  return db
    .select({ disability_type: schema.citizenDisabilities.disabilityType, description: schema.citizenDisabilities.description })
    .from(schema.citizenDisabilities)
    .where(eq(schema.citizenDisabilities.citizenId, citizenId))
    .all();
};

const insertDisabilities = async (
  db: DrizzleD1Database<typeof schema>,
  citizenId: string,
  disabilities: { disability_type: string; description?: string }[],
) => {
  if (disabilities.length === 0) return;
  await db.insert(schema.citizenDisabilities).values(
    disabilities.map((d) => ({
      id: crypto.randomUUID(),
      citizenId,
      disabilityType: d.disability_type,
      description: d.description ?? null,
    }))
  ).run();
};

const replaceDisabilities = async (
  db: DrizzleD1Database<typeof schema>,
  citizenId: string,
  disabilities: { disability_type: string; description?: string }[],
) => {
  await db.delete(schema.citizenDisabilities).where(eq(schema.citizenDisabilities.citizenId, citizenId)).run();
  await insertDisabilities(db, citizenId, disabilities);
};


// ── Response builders ─────────────────────────────────

const toCitizenResponse = async (db: DrizzleD1Database<typeof schema>, citizen: typeof schema.citizens.$inferSelect) => {
  const disabilities = await fetchDisabilities(db, citizen.id);
  return {
    id: citizen.id,
    cedula: citizen.dni,
    dni_type: citizen.dniType,
    phone: citizen.phone,
    names: citizen.firstName,
    surnames: citizen.lastName,
    birth_date: citizen.birthDate,
    gender: citizen.gender,
    is_head_of_household: citizen.isHeadOfHousehold,
    family_id: citizen.familyId,
    user_id: citizen.userId,
    disabilities,
  };
};


// ── CRUD ──────────────────────────────────────────────

export const createCitizen = async (
  db: DrizzleD1Database<typeof schema>,
  data: createCitizenInput,
) => {
  try {
    const [result] = await db
      .insert(schema.citizens)
      .values({
        dni: data.cedula,
        dniType: data.dni_type ?? 'NATIONAL',
        phone: data.phone ?? null,
        firstName: data.names,
        lastName: data.surnames,
        birthDate: data.birth_date,
        gender: data.gender,
        isHeadOfHousehold: data.is_head_of_household,
        familyId: data.family_id,
        userId: data.user_id,
      })
      .returning();

    if (!result) return { error: "No se pudo crear el ciudadano", status: 500 };

    await insertDisabilities(db, result.id, data.disabilities ?? []);
    const response = await toCitizenResponse(db, result);
    return buildSingleData(response);
  } catch (err: any) {
    const message = err?.message ?? "";
    if (message.includes("UNIQUE constraint") && message.includes("citizens.dni")) {
      return { error: `El documento ${data.cedula} ya está registrado`, status: 409 };
    }
    return { error: "Error al crear el ciudadano", status: 500 };
  }
}

export const findOneCitizen = async (db: DrizzleD1Database<typeof schema>, id: string) => {
  const result = await db.select().from(schema.citizens).where(eq(schema.citizens.id, id)).get();
  if (!result) return { data: null };
  const response = await toCitizenResponse(db, result);
  return { data: response };
}

export const findAllCitizens = async (db: DrizzleD1Database<typeof schema>, queryParams: CitizenQueryParams) => {
  const { limit, page, search, family_id, user_id, mine } = queryParams;

  const isMine = mine === "true";
  const effectiveUserId = user_id;

  const query = db
    .select({
      id: schema.citizens.id,
      dni: schema.citizens.dni,
      dniType: schema.citizens.dniType,
      phone: schema.citizens.phone,
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
      disabilityCount: sql<number>`(SELECT COUNT(*) FROM ${schema.citizenDisabilities} WHERE ${schema.citizenDisabilities.citizenId} = ${schema.citizens.id})`,
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

  if (effectiveUserId) {
    conditions.push(eq(schema.citizens.userId, effectiveUserId));
  }

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  const [rows, [{ total }]] = await Promise.all([
    query.limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(schema.citizens),
  ]);

  const data = rows.map((row) => {
    const base = {
      id: row.id,
      cedula: row.dni,
      dni_type: row.dniType,
      phone: row.phone,
      names: row.firstName,
      surnames: row.lastName,
      birth_date: row.birthDate,
      gender: row.gender,
      is_head_of_household: row.isHeadOfHousehold,
      family_id: row.familyId,
      user_id: row.userId,
      has_disability: (row.disabilityCount ?? 0) > 0,
    };

    if (isMine) {
      return {
        ...base,
        family_label: row.familyName,
        house_label: (!row.houseAddress && !row.houseSector && !row.houseNumber) ? null :
          [row.houseSector, row.houseNumber, row.houseAddress].filter(Boolean).join(" · "),
      };
    }

    return base;
  });

  return buildPaginatedData(data, total, page, limit);
};

export const updateCitizen = async (
  db: DrizzleD1Database<typeof schema>,
  id: string,
  data: updateCitizenInput,
) => {
  const updateData: Partial<typeof schema.citizens.$inferInsert> = {};

  if (data.cedula !== undefined) updateData.dni = data.cedula;
  if (data.dni_type !== undefined) updateData.dniType = data.dni_type;
  if (data.phone !== undefined) updateData.phone = data.phone;
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

  if (!result) return buildSingleData(null);

  if (data.disabilities !== undefined) {
    await replaceDisabilities(db, result.id, data.disabilities ?? []);
  }

  const response = await toCitizenResponse(db, result);
  return buildSingleData(response);
};

export const deleteCitizen = async (
  db: DrizzleD1Database<typeof schema>,
  id: string,
) => {
  await db.delete(schema.citizens).where(eq(schema.citizens.id, id)).run();
  return { message: "Ciudadano eliminado correctamente" };
};
