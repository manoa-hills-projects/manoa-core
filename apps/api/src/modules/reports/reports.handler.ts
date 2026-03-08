import type { Context } from "hono";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "@/shared/database/schemas";
import { admin, superadmin, user } from "@/shared/utils/permissions";
import type { HonoConfig } from "../../index";
import { importReportDto, type ExportReportQuery } from "./dto";
import { generateCsvReport, importCsvReport } from "./reports.service";

type ReadableResource = "houses" | "families" | "citizens";

const canReadResource = (role: string | undefined, resource: ReadableResource) => {
  const roleObj = role === "superadmin" ? superadmin : role === "admin" ? admin : user;
  const permissionRule: Record<ReadableResource, Array<"read">> = {
    [resource]: ["read"],
  } as Record<ReadableResource, Array<"read">>;

  const auth = roleObj.authorize(permissionRule);

  return auth.success;
};

const buildFilename = (filePrefix: string) => {
  const date = new Date().toISOString().slice(0, 10);
  return `${filePrefix}-${date}.csv`;
};

export const exportReport = async (
  c: Context<HonoConfig>,
  db: DrizzleD1Database<typeof schema>,
  session: HonoConfig["Variables"]["session"],
  query: ExportReportQuery,
) => {
  if (!session?.user) {
    return c.json({ message: "No autorizado" }, 401);
  }

  if (!canReadResource(session.user.role, query.resource)) {
    return c.json({ message: "No tienes permisos para exportar este recurso" }, 403);
  }

  const { csv, filePrefix } = await generateCsvReport(db, query.resource, query.search);

  return c.body(csv, 200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${buildFilename(filePrefix)}"`,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
};

export const importReport = async (
  c: Context<HonoConfig>,
  db: DrizzleD1Database<typeof schema>,
  session: HonoConfig["Variables"]["session"],
) => {
  if (!session?.user) {
    return c.json({ message: "No autorizado" }, 401);
  }

  const body = await c.req.parseBody();
  const fileField = body.file;
  const resource = typeof body.resource === "string" ? body.resource : "";
  const format = typeof body.format === "string" ? body.format : "csv";

  const parsedRequest = importReportDto.safeParse({ resource, format });

  if (!parsedRequest.success) {
    return c.json({ message: "Parámetros de importación inválidos" }, 400);
  }

  if (!canReadResource(session.user.role, parsedRequest.data.resource)) {
    return c.json({ message: "No tienes permisos para importar este recurso" }, 403);
  }

  const file = Array.isArray(fileField) ? fileField[0] : fileField;

  if (!(file instanceof File)) {
    return c.json({ message: "Debes adjuntar un archivo CSV" }, 400);
  }

  const csvContent = await file.text();

  if (!csvContent.trim()) {
    return c.json({ message: "El archivo CSV está vacío" }, 400);
  }

  const result = await importCsvReport(db, parsedRequest.data.resource, csvContent);

  return c.json(result, 200);
};
