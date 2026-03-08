import { z } from "zod";

export const importReportDto = z.object({
  resource: z.enum(["houses", "families", "citizens"]),
  format: z.enum(["csv"]).default("csv"),
});

export type ImportReportInput = z.infer<typeof importReportDto>;
