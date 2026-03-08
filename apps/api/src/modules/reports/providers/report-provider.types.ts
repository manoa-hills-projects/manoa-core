import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "@/shared/database/schemas";

export type ReportResource = "houses" | "families" | "citizens";

export interface CsvColumn {
  key: string;
  header: string;
}

export interface ReportProvider {
  resource: ReportResource;
  filePrefix: string;
  columns: CsvColumn[];
  getRows: (params: {
    db: DrizzleD1Database<typeof schema>;
    search?: string;
  }) => Promise<Array<Record<string, unknown>>>;
}
