import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "@/shared/database/schemas";
import Papa from "papaparse";
import { createHouseDto } from "../house/dto/create-house.dto";
import { createFamilyDto } from "../family/dto/create-family.dto";
import { createCitizenDto } from "../citizen/dto/create-citizen.dto";
import { citizensReportProvider } from "./providers/citizens-report.provider";
import { familiesReportProvider } from "./providers/families-report.provider";
import { housesReportProvider } from "./providers/houses-report.provider";
import type { ReportProvider, ReportResource } from "./providers/report-provider.types";
import { toCsv } from "./utils/csv.util";

const reportProviders: Record<ReportResource, ReportProvider> = {
  houses: housesReportProvider,
  families: familiesReportProvider,
  citizens: citizensReportProvider,
};

export const getReportProvider = (resource: ReportResource) => reportProviders[resource];

export const generateCsvReport = async (
  db: DrizzleD1Database<typeof schema>,
  resource: ReportResource,
  search?: string,
) => {
  const provider = getReportProvider(resource);
  const rows = await provider.getRows({ db, search });
  const csv = toCsv(provider.columns, rows);

  return {
    csv,
    filePrefix: provider.filePrefix,
  };
};

const normalizeBoolean = (value: string | undefined) => {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  return ["1", "true", "si", "sí", "yes", "y"].includes(normalized);
};

const getCell = (row: Record<string, string>, key: string) => row[key]?.trim() ?? "";

export interface ImportReportResult {
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errors: Array<{ row: number; message: string }>;
}

export const importCsvReport = async (
  db: DrizzleD1Database<typeof schema>,
  resource: ReportResource,
  csvContent: string,
): Promise<ImportReportResult> => {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const errors: Array<{ row: number; message: string }> = parsed.errors.map((error) => ({
    row: (error.row ?? 0) + 1,
    message: error.message,
  }));

  let importedRows = 0;

  for (const [index, row] of parsed.data.entries()) {
    const rowNumber = index + 2;

    if (!Object.values(row).some((value) => value && value.trim().length > 0)) {
      continue;
    }

    try {
      if (resource === "houses") {
        const payload = {
          address: getCell(row, "address"),
          sector: getCell(row, "sector"),
          number: getCell(row, "number"),
        };

        const parsedHouse = createHouseDto.safeParse(payload);

        if (!parsedHouse.success) {
          const issue = parsedHouse.error.issues[0];
          errors.push({ row: rowNumber, message: issue?.message ?? "Fila inválida" });
          continue;
        }

        await db.insert(schema.houses).values(parsedHouse.data).run();
        importedRows += 1;
        continue;
      }

      if (resource === "families") {
        const rawHeadId = getCell(row, "head_of_household_id");
        const payload = {
          family_name: getCell(row, "family_name"),
          house_id: getCell(row, "house_id"),
          ...(rawHeadId ? { head_of_household_id: rawHeadId } : {}),
        };

        const parsedFamily = createFamilyDto.safeParse(payload);

        if (!parsedFamily.success) {
          const issue = parsedFamily.error.issues[0];
          errors.push({ row: rowNumber, message: issue?.message ?? "Fila inválida" });
          continue;
        }

        await db
          .insert(schema.families)
          .values({
            name: parsedFamily.data.family_name,
            houseId: parsedFamily.data.house_id,
            headId: parsedFamily.data.head_of_household_id ?? null,
          })
          .run();

        importedRows += 1;
        continue;
      }

      const rawFamilyId = getCell(row, "family_id");
      const rawUserId = getCell(row, "user_id");

      const payload = {
        cedula: getCell(row, "cedula"),
        names: getCell(row, "names"),
        surnames: getCell(row, "surnames"),
        birth_date: getCell(row, "birth_date"),
        gender: getCell(row, "gender"),
        is_head_of_household: normalizeBoolean(getCell(row, "is_head_of_household")),
        ...(rawFamilyId ? { family_id: rawFamilyId } : {}),
        ...(rawUserId ? { user_id: rawUserId } : {}),
      };

      const parsedCitizen = createCitizenDto.safeParse(payload);

      if (!parsedCitizen.success) {
        const issue = parsedCitizen.error.issues[0];
        errors.push({ row: rowNumber, message: issue?.message ?? "Fila inválida" });
        continue;
      }

      await db
        .insert(schema.citizens)
        .values({
          dni: parsedCitizen.data.cedula,
          firstName: parsedCitizen.data.names,
          lastName: parsedCitizen.data.surnames,
          birthDate: parsedCitizen.data.birth_date,
          gender: parsedCitizen.data.gender,
          isHeadOfHousehold: parsedCitizen.data.is_head_of_household,
          familyId: parsedCitizen.data.family_id,
          userId: parsedCitizen.data.user_id,
        })
        .run();

      importedRows += 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error inesperado";
      errors.push({ row: rowNumber, message: errorMessage });
    }
  }

  return {
    totalRows: parsed.data.length,
    importedRows,
    failedRows: errors.length,
    errors,
  };
};
