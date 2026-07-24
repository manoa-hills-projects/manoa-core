import { eq, sql } from "drizzle-orm";
import * as schema from "@/shared/database/schemas";
import type { ReportProvider } from "./report-provider.types";

const genderLabel = (g: string) => {
  if (g === "MASCULINO" || g === "M") return "Masculino";
  if (g === "FEMENINO" || g === "F") return "Femenino";
  return g;
};

export const citizensReportProvider: ReportProvider = {
  resource: "citizens",
  filePrefix: "ciudadanos",
  columns: [
    { key: "id", header: "ID" },
    { key: "documento", header: "Documento" },
    { key: "names", header: "Nombres" },
    { key: "surnames", header: "Apellidos" },
    { key: "phone", header: "Teléfono" },
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
        dniType: schema.citizens.dniType,
        phone: schema.citizens.phone,
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

    return rows.map((row) => {
      const prefix = row.dniType === "NATIONAL" ? "V" : row.dniType === "FOREIGN" ? "E" : "";
      return {
        id: row.id,
        documento: prefix ? `${prefix}-${row.dni}` : row.dni,
        names: row.firstName,
        surnames: row.lastName,
        phone: row.phone ?? "",
        gender: genderLabel(row.gender),
        birth_date: row.birthDate,
        family_label: row.familyName ?? "",
        is_head_of_household: row.isHeadOfHousehold ? "Sí" : "No",
      };
    });
  },
};
