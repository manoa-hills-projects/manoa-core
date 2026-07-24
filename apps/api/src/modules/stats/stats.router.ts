import { Hono } from "hono";
import { count, desc, eq, sql } from "drizzle-orm";
import type { HonoConfig } from "../../index";
import * as schema from "../../shared/database/schemas";

// Tipos de discapacidad
const DISABILITY_TYPES = [
  "visual", "auditiva", "fisica", "intelectual",
  "psicosocial", "multiple", "otra",
] as const;

export const statsRouter = new Hono<HonoConfig>()

  .get("/overview", async (c) => {
    const db = c.get("db");

    const [
      housesTotal,
      familiesTotal,
      citizensTotal,
      housesBySector,
      citizensBySector,
      citizensComposition,
      genderBreakdown,
      ageBreakdown,
      requestsByStatus,
      requestsByMonth,
      pollsByStatus,
    ] = await Promise.all([
      db.select({ count: count() }).from(schema.houses).get(),
      db.select({ count: count() }).from(schema.families).get(),
      db.select({ count: count() }).from(schema.citizens).get(),
      db
        .select({ sector: schema.houses.sector, count: count() })
        .from(schema.houses)
        .groupBy(schema.houses.sector)
        .orderBy(desc(count()))
        .all(),
      db
        .select({ sector: schema.houses.sector, count: count() })
        .from(schema.citizens)
        .innerJoin(schema.families, eq(schema.citizens.familyId, schema.families.id))
        .innerJoin(schema.houses, eq(schema.families.houseId, schema.houses.id))
        .groupBy(schema.houses.sector)
        .orderBy(desc(count()))
        .all(),
      db
        .select({ isHead: schema.citizens.isHeadOfHousehold, count: count() })
        .from(schema.citizens)
        .groupBy(schema.citizens.isHeadOfHousehold)
        .all(),
      db
        .select({ gender: schema.citizens.gender, count: count() })
        .from(schema.citizens)
        .groupBy(schema.citizens.gender)
        .all(),
      db
        .select({
          ageGroup: sql<string>`CASE WHEN CAST(strftime('%Y', 'now') - CAST(strftime('%Y', ${schema.citizens.birthDate}) AS INTEGER) AS INTEGER) < 18 THEN 'minor' ELSE 'adult' END`,
          count: count(),
        })
        .from(schema.citizens)
        .groupBy(sql`CASE WHEN CAST(strftime('%Y', 'now') - CAST(strftime('%Y', ${schema.citizens.birthDate}) AS INTEGER) AS INTEGER) < 18 THEN 'minor' ELSE 'adult' END`)
        .all(),
      db
        .select({ status: schema.documentRequests.status, count: count() })
        .from(schema.documentRequests)
        .groupBy(schema.documentRequests.status)
        .all(),
      db
        .select({
          month: sql<string>`strftime('%Y-%m', datetime(${schema.documentRequests.createdAt}, 'unixepoch'))`,
          count: count(),
        })
        .from(schema.documentRequests)
        .groupBy(
          sql`strftime('%Y-%m', datetime(${schema.documentRequests.createdAt}, 'unixepoch'))`,
        )
        .orderBy(
          sql`strftime('%Y-%m', datetime(${schema.documentRequests.createdAt}, 'unixepoch'))`,
        )
        .all(),
      db
        .select({ status: schema.polls.status, count: count() })
        .from(schema.polls)
        .groupBy(schema.polls.status)
        .all(),
    ]);

    // Merge houses + citizens by sector
    const sectorMap = new Map<string, { sector: string; houses: number; citizens: number }>();
    for (const h of housesBySector) {
      sectorMap.set(h.sector, { sector: h.sector, houses: h.count, citizens: 0 });
    }
    for (const cit of citizensBySector) {
      const entry = sectorMap.get(cit.sector);
      if (entry) {
        entry.citizens = cit.count;
      } else {
        sectorMap.set(cit.sector, { sector: cit.sector, houses: 0, citizens: cit.count });
      }
    }
    const bySector = Array.from(sectorMap.values()).sort((a, b) => b.citizens - a.citizens);

    const headsCount = citizensComposition.find((item) => item.isHead === true)?.count ?? 0;
    const membersCount = citizensComposition.find((item) => item.isHead !== true)?.count ?? 0;

    const pollOpen = pollsByStatus.find((p) => p.status === "open")?.count ?? 0;
    const pollClosed = pollsByStatus.find((p) => p.status === "closed")?.count ?? 0;

    const maleCount = genderBreakdown.find((g) => g.gender === "MASCULINO" || g.gender === "M")?.count ?? 0;
    const femaleCount = genderBreakdown.find((g) => g.gender === "FEMENINO" || g.gender === "F")?.count ?? 0;
    const minorCount = ageBreakdown.find((a) => a.ageGroup === "minor")?.count ?? 0;
    const adultCount = ageBreakdown.find((a) => a.ageGroup === "adult")?.count ?? 0;

    return c.json({
      census: {
        totals: {
          houses: housesTotal?.count ?? 0,
          families: familiesTotal?.count ?? 0,
          citizens: citizensTotal?.count ?? 0,
        },
        bySector,
        composition: {
          heads: headsCount,
          members: membersCount,
        },
        gender: {
          male: maleCount,
          female: femaleCount,
        },
        age: {
          minors: minorCount,
          adults: adultCount,
        },
      },
      requests: {
        total: requestsByStatus.reduce((s, r) => s + r.count, 0),
        byStatus: requestsByStatus,
        byMonth: requestsByMonth,
      },
      polls: {
        total: pollOpen + pollClosed,
        open: pollOpen,
        closed: pollClosed,
      },
    });
  })

  .get("/citizens", async (c) => {
    const db = c.get("db");

    const [total, headsResult, genderData, disabilityData] = await Promise.all([
      db.select({ count: count() }).from(schema.citizens).get(),
      db
        .select({ count: count() })
        .from(schema.citizens)
        .where(eq(schema.citizens.isHeadOfHousehold, true))
        .get(),
      db
        .select({ gender: schema.citizens.gender, count: count() })
        .from(schema.citizens)
        .groupBy(schema.citizens.gender)
        .all(),
      db
        .select({ type: schema.citizenDisabilities.disabilityType, count: count() })
        .from(schema.citizenDisabilities)
        .groupBy(schema.citizenDisabilities.disabilityType)
        .all(),
    ]);

    const maleCount = genderData.find((g) => g.gender === "MASCULINO" || g.gender === "M")?.count ?? 0;
    const femaleCount = genderData.find((g) => g.gender === "FEMENINO" || g.gender === "F")?.count ?? 0;
    const totalCitizens = total?.count ?? 0;
    const headsCount = headsResult?.count ?? 0;
    const disabledTotal = disabilityData.reduce((s, d) => s + d.count, 0);

    const byType: Record<string, number> = {};
    for (const d of disabilityData) {
      byType[d.type] = d.count;
    }

    return c.json({
      total: totalCitizens,
      gender: {
        male: maleCount,
        female: femaleCount,
      },
      headsOfHousehold: headsCount,
      disabilities: {
        total: disabledTotal,
        byType,
      },
    });
  });
