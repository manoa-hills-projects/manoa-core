import { api } from "@/shared/api/api-client";
import type { ExportReportParams } from "../model/types";

export interface ExportReportResult {
  blob: Blob;
  fileName: string;
}

const getFilenameFromContentDisposition = (headerValue: string | null, fallback: string) => {
  if (!headerValue) return fallback;

  const match = headerValue.match(/filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i);
  const encodedName = match?.[1] || match?.[2];

  if (!encodedName) return fallback;

  try {
    return decodeURIComponent(encodedName);
  } catch {
    return encodedName;
  }
};

export const exportReportCsv = async ({ resource, search }: ExportReportParams): Promise<ExportReportResult> => {
  const response = await api.get("reports/export", {
    searchParams: {
      resource,
      format: "csv",
      ...(search ? { search } : {}),
    },
  });

  const blob = await response.blob();
  const fileName = getFilenameFromContentDisposition(
    response.headers.get("content-disposition"),
    `${resource}-reporte.csv`,
  );

  return { blob, fileName };
};
