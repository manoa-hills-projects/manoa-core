import type { CsvColumn } from "../providers/report-provider.types";

const escapeCsvValue = (value: unknown) => {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes("\r") ||
    stringValue.includes('"')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

export const toCsv = (columns: CsvColumn[], rows: Array<Record<string, unknown>>) => {
  const headerRow = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const dataRows = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column.key])).join(","),
  );

  // BOM para Excel (UTF-8)
  return `\uFEFF${[headerRow, ...dataRows].join("\n")}`;
};
