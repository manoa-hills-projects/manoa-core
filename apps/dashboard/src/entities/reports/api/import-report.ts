import { api } from "@/shared/api/api-client";
import type { ReportResource } from "../model/types";

export interface ImportReportResult {
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

export const importReportCsv = async ({
  resource,
  file,
}: {
  resource: ReportResource;
  file: File;
}): Promise<ImportReportResult> => {
  const formData = new FormData();
  formData.append("resource", resource);
  formData.append("format", "csv");
  formData.append("file", file);

  return api.post("reports/import", {
    body: formData,
  }).json<ImportReportResult>();
};
