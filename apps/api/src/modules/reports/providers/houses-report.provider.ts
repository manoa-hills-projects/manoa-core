import { sql } from "drizzle-orm";
import * as schema from "@/shared/database/schemas";
import type { ReportProvider } from "./report-provider.types";

const HOUSE_TYPE_LABELS: Record<string, string> = {
  casa: "Casa", apartamento: "Apartamento", rancho: "Rancho", local: "Local", otro: "Otro",
};
const TENURE_LABELS: Record<string, string> = {
  propia: "Propia", alquilada: "Alquilada", cedida: "Cedida", otra: "Otra",
};

export const housesReportProvider: ReportProvider = {
  resource: "houses",
  filePrefix: "viviendas",
  columns: [
    { key: "id", header: "ID" },
    { key: "address", header: "Dirección" },
    { key: "sector", header: "Sector" },
    { key: "number", header: "Número" },
    { key: "phone", header: "Teléfono" },
    { key: "type", header: "Tipo" },
    { key: "tenure", header: "Tenencia" },
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
      phone: row.phone ?? "",
      type: row.type ? HOUSE_TYPE_LABELS[row.type] ?? row.type : "",
      tenure: row.tenure ? TENURE_LABELS[row.tenure] ?? row.tenure : "",
    }));
  },
};
