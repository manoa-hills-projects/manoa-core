import { eq, sql } from "drizzle-orm";
import * as schema from "@/shared/database/schemas";
import type { ReportProvider } from "./report-provider.types";

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

export const familiesReportProvider: ReportProvider = {
  resource: "families",
  filePrefix: "familias",
  columns: [
    { key: "id", header: "ID" },
    { key: "family_name", header: "Nombre de familia" },
    { key: "house_label", header: "Vivienda" },
    { key: "head_of_household_label", header: "Jefe de hogar" },
  ],
  getRows: async ({ db, search }) => {
    const query = db
      .select({
        id: schema.families.id,
        name: schema.families.name,
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

    const rows = await query;

    return rows.map((row) => ({
      id: row.id,
      family_name: row.name,
      house_label: formatHouseLabel({
        address: row.houseAddress,
        sector: row.houseSector,
        number: row.houseNumber,
      }),
      head_of_household_label: formatHeadOfHouseholdLabel({
        firstName: row.headFirstName,
        lastName: row.headLastName,
        dni: row.headDni,
      }),
    }));
  },
};
