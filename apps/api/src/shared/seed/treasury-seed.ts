/**
 * Seed del módulo Treasury.
 *
 * Popula el catálogo base (categorías + conceptos + tasa del día) y — si hay
 * usuarios ciudadanos disponibles — algunos pagos y egresos de muestra para
 * que la vista de transparencia y la bandeja del tesorero se vean vivas.
 *
 * Idempotente: usa `onConflictDoNothing` en categorías/conceptos por `key`.
 * Los pagos/egresos de muestra solo se insertan si aún no hay ninguno.
 *
 * @module seed/treasury-seed
 */

import { and, eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "../database/schemas";
import {
  treasuryCategories,
  treasuryConcepts,
  treasuryExpenses,
  treasuryPayments,
  treasuryRates,
} from "../database/schemas/treasury.schema";
import { user as userTable } from "../database/schemas/auth.schema";
import { userProfiles, profiles } from "../database/schemas/rbac.schema";

type Database = DrizzleD1Database<typeof schema>;

export interface SeedTreasuryResult {
  categoriesInserted: number;
  categoriesSkipped: number;
  conceptsInserted: number;
  conceptsSkipped: number;
  rateSet: boolean;
  expensesInserted: number;
  paymentsInserted: number;
  warnings: string[];
}

const CATEGORY_SEEDS = [
  {
    key: "cuotas_ordinarias",
    name: "Cuotas ordinarias",
    description: "Aportes mensuales regulares del vecindario",
    kind: "income" as const,
  },
  {
    key: "cuotas_extraordinarias",
    name: "Cuotas extraordinarias",
    description: "Aportes puntuales para gastos especiales",
    kind: "income" as const,
  },
  {
    key: "donaciones",
    name: "Donaciones",
    description: "Aportes voluntarios adicionales",
    kind: "income" as const,
  },
  {
    key: "mantenimiento",
    name: "Mantenimiento",
    description: "Reparaciones, pintura, limpieza, jardinería",
    kind: "expense" as const,
  },
  {
    key: "seguridad",
    name: "Seguridad",
    description: "Vigilancia, cámaras, alarmas",
    kind: "expense" as const,
  },
  {
    key: "servicios",
    name: "Servicios",
    description: "Luz, agua, gas de áreas comunes",
    kind: "expense" as const,
  },
];

interface ConceptSeed {
  key: string;
  name: string;
  description: string;
  categoryKey: string;
  defaultBsCents: number;
  defaultUsdCents: number;
}

const CONCEPT_SEEDS: ConceptSeed[] = [
  {
    key: "cuota_dic_2025",
    name: "Cuota Diciembre 2025",
    description: "Aporte mensual ordinario",
    categoryKey: "cuotas_ordinarias",
    defaultBsCents: 150000, // Bs 1500,00
    defaultUsdCents: 5000, // $50,00
  },
  {
    key: "cuota_ene_2026",
    name: "Cuota Enero 2026",
    description: "Aporte mensual ordinario",
    categoryKey: "cuotas_ordinarias",
    defaultBsCents: 180000, // Bs 1800,00
    defaultUsdCents: 6000, // $60,00
  },
  {
    key: "cuota_feb_2026",
    name: "Cuota Febrero 2026",
    description: "Aporte mensual ordinario",
    categoryKey: "cuotas_ordinarias",
    defaultBsCents: 180000,
    defaultUsdCents: 6000,
  },
  {
    key: "pintura_porton_2026",
    name: "Pintura portón principal",
    description: "Aporte extraordinario para pintar el portón",
    categoryKey: "cuotas_extraordinarias",
    defaultBsCents: 30000, // Bs 300,00
    defaultUsdCents: 1000, // $10,00
  },
];

interface ExpenseSeed {
  categoryKey: string;
  description: string;
  beneficiary: string | null;
  amountBsCents: number;
  amountUsdCents: number;
  daysAgo: number;
}

const EXPENSE_SAMPLES: ExpenseSeed[] = [
  {
    categoryKey: "mantenimiento",
    description: "Pintura y brochas para portón principal",
    beneficiary: "Ferretería Manoa",
    amountBsCents: 24000, // Bs 240
    amountUsdCents: 800, // $8
    daysAgo: 12,
  },
  {
    categoryKey: "servicios",
    description: "Recarga eléctrica áreas comunes (noviembre)",
    beneficiary: "Corpoelec",
    amountBsCents: 45000, // Bs 450
    amountUsdCents: 1500, // $15
    daysAgo: 5,
  },
  {
    categoryKey: "seguridad",
    description: "Batería para alarma principal",
    beneficiary: "Electro Nueva Barcelona",
    amountBsCents: 18000, // Bs 180
    amountUsdCents: 600, // $6
    daysAgo: 20,
  },
];

interface PaymentSample {
  conceptKey: string;
  amountBsCents: number;
  amountUsdCents: number;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  reviewNotes: string | null;
  daysAgo: number;
}

const PAYMENT_SAMPLES: PaymentSample[] = [
  {
    conceptKey: "cuota_dic_2025",
    amountBsCents: 150000,
    amountUsdCents: 5000,
    description: "Transferencia banesco ref 8829",
    status: "approved",
    reviewNotes: null,
    daysAgo: 30,
  },
  {
    conceptKey: "cuota_ene_2026",
    amountBsCents: 180000,
    amountUsdCents: 6000,
    description: "Pago móvil BDV",
    status: "approved",
    reviewNotes: null,
    daysAgo: 8,
  },
  {
    conceptKey: "cuota_feb_2026",
    amountBsCents: 180000,
    amountUsdCents: 6000,
    description: "Pago pendiente febrero",
    status: "pending",
    reviewNotes: null,
    daysAgo: 1,
  },
  {
    conceptKey: "pintura_porton_2026",
    amountBsCents: 30000,
    amountUsdCents: 1000,
    description: "Aporte pintura portón",
    status: "rejected",
    reviewNotes:
      "El comprobante no es legible. Por favor, envíe una foto más clara con el número de referencia visible.",
    daysAgo: 3,
  },
];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/**
 * Ejecuta el seed de tesorería.
 *
 * @param db - Instancia Drizzle
 * @param systemUserId - Usuario "sistema" para `createdBy`/`registeredBy`
 */
export async function seedTreasury(
  db: Database,
  systemUserId: string
): Promise<SeedTreasuryResult> {
  const result: SeedTreasuryResult = {
    categoriesInserted: 0,
    categoriesSkipped: 0,
    conceptsInserted: 0,
    conceptsSkipped: 0,
    rateSet: false,
    expensesInserted: 0,
    paymentsInserted: 0,
    warnings: [],
  };

  // ── 1. Categorías ────────────────────────────────────────────
  const existingCategories = await db.select().from(treasuryCategories).all();
  const catByKey = new Map(existingCategories.map((c) => [c.key, c.id]));

  for (const cat of CATEGORY_SEEDS) {
    if (catByKey.has(cat.key)) {
      result.categoriesSkipped++;
      continue;
    }
    const [inserted] = await db
      .insert(treasuryCategories)
      .values({
        key: cat.key,
        name: cat.name,
        description: cat.description,
        kind: cat.kind,
        isActive: true,
      })
      .returning();
    catByKey.set(cat.key, inserted.id);
    result.categoriesInserted++;
  }

  // ── 2. Conceptos ─────────────────────────────────────────────
  const existingConcepts = await db.select().from(treasuryConcepts).all();
  const conceptByKey = new Map(existingConcepts.map((c) => [c.key, c.id]));

  for (const con of CONCEPT_SEEDS) {
    if (conceptByKey.has(con.key)) {
      result.conceptsSkipped++;
      continue;
    }
    const catId = catByKey.get(con.categoryKey);
    if (!catId) {
      result.warnings.push(
        `Concepto "${con.key}" saltado: categoría "${con.categoryKey}" no existe`
      );
      continue;
    }
    const [inserted] = await db
      .insert(treasuryConcepts)
      .values({
        key: con.key,
        name: con.name,
        description: con.description,
        categoryId: catId,
        defaultBsCents: con.defaultBsCents,
        defaultUsdCents: con.defaultUsdCents,
        isActive: true,
        createdBy: systemUserId,
      })
      .returning();
    conceptByKey.set(con.key, inserted.id);
    result.conceptsInserted++;
  }

  // ── 3. Tasa del día ──────────────────────────────────────────
  const today = todayIsoDate();
  const existingRate = await db
    .select()
    .from(treasuryRates)
    .where(eq(treasuryRates.date, today))
    .get();

  let rateId: string;
  if (existingRate) {
    rateId = existingRate.id;
  } else {
    const [inserted] = await db
      .insert(treasuryRates)
      .values({ date: today, bsPerUsd: "30.00", createdBy: systemUserId })
      .returning();
    rateId = inserted.id;
    result.rateSet = true;
  }

  // ── 4. Egresos de muestra (solo si no hay ninguno todavía) ───
  const expenseCount = await db
    .select({ n: sql<number>`count(*)` })
    .from(treasuryExpenses)
    .get();

  if ((expenseCount?.n ?? 0) === 0) {
    for (const exp of EXPENSE_SAMPLES) {
      const catId = catByKey.get(exp.categoryKey);
      if (!catId) continue;
      await db.insert(treasuryExpenses).values({
        categoryId: catId,
        description: exp.description,
        beneficiary: exp.beneficiary,
        amountBsCents: exp.amountBsCents,
        amountUsdCents: exp.amountUsdCents,
        rateId,
        receiptR2Key: null,
        spentAt: daysAgo(exp.daysAgo),
        registeredBy: systemUserId,
      });
      result.expensesInserted++;
    }
  } else {
    result.warnings.push(
      "Ya hay egresos registrados; se omitieron los egresos de muestra"
    );
  }

  // ── 5. Pagos de muestra (requieren ciudadanos y no debe haber pagos aún) ─
  const paymentCount = await db
    .select({ n: sql<number>`count(*)` })
    .from(treasuryPayments)
    .get();

  if ((paymentCount?.n ?? 0) > 0) {
    result.warnings.push(
      "Ya hay pagos registrados; se omitieron los pagos de muestra"
    );
    return result;
  }

  // Buscar usuarios con perfil "citizen" (default) — hasta 3 diferentes
  const citizenUsers = await db
    .select({ userId: userTable.id })
    .from(userTable)
    .innerJoin(userProfiles, eq(userProfiles.userId, userTable.id))
    .innerJoin(profiles, eq(profiles.id, userProfiles.profileId))
    .where(and(eq(profiles.key, "citizen"), eq(profiles.isActive, true)))
    .limit(3)
    .all();

  if (citizenUsers.length === 0) {
    result.warnings.push(
      "No se encontraron usuarios con perfil citizen; no se crearon pagos de muestra. Registre un ciudadano primero."
    );
    return result;
  }

  // NOTA: los pagos requieren `receipt_r2_key` NOT NULL. Como no podemos
  // subir imágenes reales desde el seed, usamos una key placeholder. El
  // endpoint `/receipts/*` va a devolver 404 al intentar ver la imagen,
  // pero los datos del pago (monto, estado, notas) se ven correctamente
  // en las listas y en la bandeja. Docmentar esto en warnings.
  result.warnings.push(
    "Los comprobantes de los pagos de muestra son placeholders. Al abrirlos desde la bandeja del tesorero, la imagen dará 404. Los datos (monto, estado, notas) se ven bien."
  );

  for (let i = 0; i < PAYMENT_SAMPLES.length; i++) {
    const sample = PAYMENT_SAMPLES[i];
    const conceptId = conceptByKey.get(sample.conceptKey);
    if (!conceptId) continue;

    // Rotar entre ciudadanos disponibles
    const user = citizenUsers[i % citizenUsers.length];
    const submitted = daysAgo(sample.daysAgo);
    const reviewedAt =
      sample.status !== "pending"
        ? new Date(submitted.getTime() + 60 * 60 * 1000)
        : null;

    await db.insert(treasuryPayments).values({
      userId: user.userId,
      conceptId,
      description: sample.description,
      amountBsCents: sample.amountBsCents,
      amountUsdCents: sample.amountUsdCents,
      rateId,
      receiptR2Key: `receipts/payments/${user.userId}/seed/placeholder-${i}.jpg`,
      status: sample.status,
      reviewNotes: sample.reviewNotes,
      reviewedBy: sample.status !== "pending" ? systemUserId : null,
      reviewedAt,
      submittedAt: submitted,
    });
    result.paymentsInserted++;
  }

  return result;
}
