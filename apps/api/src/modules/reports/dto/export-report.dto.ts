import { z } from "zod";

export const exportReportDto = z.object({
  resource: z.enum(["houses", "families", "citizens"]),
  format: z.enum(["csv"]).default("csv"),
  search: z.string().trim().optional(),
});

export type ExportReportQuery = z.infer<typeof exportReportDto>;
