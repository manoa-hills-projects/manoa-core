import { sql } from "drizzle-orm";
import * as schema from "@/shared/database/schemas";
import type { ReportProvider } from "./report-provider.types";

export const housesReportProvider: ReportProvider = {
  resource: "houses",
  filePrefix: "viviendas",
  columns: [
    { key: "id", header: "ID" },
    { key: "address", header: "Dirección" },
    { key: "sector", header: "Sector" },
    { key: "number", header: "Número" },
  ],
  getRows: async ({ db, search }) => {
    const query = db.select().from(schema.houses);

    if (search) {
      query.where(
        sql`LOWER(${schema.houses.address}) LIKE ${`%${search.toLowerCase()}%`}`,
      );
    }

    const rows = await query;

    return rows.map((row) => ({
      id: row.id,
      address: row.address,
      sector: row.sector,
      number: row.number,
    }));
  },
};
