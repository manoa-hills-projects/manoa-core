import { eq, sql } from "drizzle-orm";
import * as schema from "@/shared/database/schemas";
import type { ReportProvider } from "./report-provider.types";

export const citizensReportProvider: ReportProvider = {
  resource: "citizens",
  filePrefix: "ciudadanos",
  columns: [
    { key: "id", header: "ID" },
    { key: "cedula", header: "Cédula" },
    { key: "names", header: "Nombres" },
    { key: "surnames", header: "Apellidos" },
    { key: "gender", header: "Género" },
    { key: "birth_date", header: "Fecha de nacimiento" },
    { key: "family_label", header: "Familia" },
    { key: "is_head_of_household", header: "Jefe de hogar" },
  ],
  getRows: async ({ db, search }) => {
    const query = db
      .select({
        id: schema.citizens.id,
        dni: schema.citizens.dni,
        firstName: schema.citizens.firstName,
        lastName: schema.citizens.lastName,
        birthDate: schema.citizens.birthDate,
        gender: schema.citizens.gender,
        isHeadOfHousehold: schema.citizens.isHeadOfHousehold,
        familyName: schema.families.name,
      })
      .from(schema.citizens)
      .leftJoin(schema.families, eq(schema.families.id, schema.citizens.familyId));

    if (search) {
      query.where(
        sql`LOWER(${schema.citizens.dni}) LIKE ${`%${search.toLowerCase()}%`} OR LOWER(${schema.citizens.firstName}) LIKE ${`%${search.toLowerCase()}%`} OR LOWER(${schema.citizens.lastName}) LIKE ${`%${search.toLowerCase()}%`}`,
      );
    }

    const rows = await query;

    return rows.map((row) => ({
      id: row.id,
      cedula: row.dni,
      names: row.firstName,
      surnames: row.lastName,
      birth_date: row.birthDate,
      gender: row.gender,
      family_label: row.familyName,
      is_head_of_household: row.isHeadOfHousehold ? "Sí" : "No",
    }));
  },
};
