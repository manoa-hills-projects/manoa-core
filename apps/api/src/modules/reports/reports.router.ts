import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { HonoConfig } from "../../index";
import { exportReportDto } from "./dto";
import { exportReport, importReport } from "./reports.handler";
import { requirePermission } from "../../shared/utils/permissions.middleware";
import { MODULES } from "../../shared/constants";

const reportsRouter = new Hono<HonoConfig>()
  .get(
    "/export",
    requirePermission(MODULES.REPORTS),
    zValidator("query", exportReportDto),
    async (c) => {
      const db = c.get("db");
      const session = c.get("session");
      const query = c.req.valid("query");

      return exportReport(c, db, session, query);
    },
  )
  .post("/import", requirePermission(MODULES.REPORTS), async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    return importReport(c, db, session);
  });

export default reportsRouter;
