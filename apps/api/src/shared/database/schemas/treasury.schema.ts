/**
 * Treasury Schema — Sistema de facturación y trazabilidad financiera
 *
 * Modelo dual Bs/USD con tasa del día única. Los montos se guardan como
 * enteros (centavos) para evitar drift de floats en SQLite. La tasa se
 * congela por transacción vía FK a `treasury_rates`, preservando trazabilidad
 * histórica aunque la tasa vigente cambie después.
 *
 * Tablas:
 * - `treasury_categories` — categorías de ingresos/egresos (para reportes).
 * - `treasury_concepts` — catálogo de "cobros" que el tesorero publica.
 * - `treasury_rates` — tasa Bs/USD del día (una por fecha).
 * - `treasury_payments` — pagos que suben los ciudadanos (con workflow).
 * - `treasury_expenses` — egresos que registra el tesorero (sin workflow).
 *
 * @module treasury
 */

import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { baseColumns } from "./base.schema";
import { user } from "./auth.schema";

// ═══════════════════════════════════════════════════════════════
// CATEGORÍAS
// ═══════════════════════════════════════════════════════════════

/**
 * Categorías comunes de ingresos/egresos. Alimenta la vista de transparencia
 * (agregado por categoría) y los reportes.
 */
export const treasuryCategories = sqliteTable("treasury_categories", {
  ...baseColumns,
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  kind: text("kind", { enum: ["income", "expense", "both"] })
    .default("both")
    .notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
});

// ═══════════════════════════════════════════════════════════════
// CONCEPTOS (catálogo del tesorero)
// ═══════════════════════════════════════════════════════════════

/**
 * "Cuota Enero 2026", "Reparación portón", etc. El ciudadano paga contra
 * uno de estos conceptos. Guardan monto sugerido en ambas monedas y ventana
 * de vigencia.
 */
export const treasuryConcepts = sqliteTable("treasury_concepts", {
  ...baseColumns,
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: text("category_id")
    .notNull()
    .references(() => treasuryCategories.id, { onDelete: "restrict" }),
  defaultBsCents: integer("default_bs_cents"),
  defaultUsdCents: integer("default_usd_cents"),
  validFrom: integer("valid_from", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  validUntil: integer("valid_until", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
});

// ═══════════════════════════════════════════════════════════════
// TASA DE CAMBIO (Bs por USD)
// ═══════════════════════════════════════════════════════════════

/**
 * Tasa del día única. La fecha (YYYY-MM-DD como texto) es UNIQUE. Todos los
 * pagos/egresos del día toman esta tasa vía FK.
 *
 * `bsPerUsd` se guarda como texto para preservar precisión decimal exacta
 * (SQLite no tiene decimal nativo; guardar como float pierde precisión).
 */
export const treasuryRates = sqliteTable("treasury_rates", {
  ...baseColumns,
  date: text("date").notNull().unique(), // YYYY-MM-DD
  bsPerUsd: text("bs_per_usd").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
});

// ═══════════════════════════════════════════════════════════════
// PAGOS DE CIUDADANOS (workflow pending → approved/rejected)
// ═══════════════════════════════════════════════════════════════

/**
 * Un ciudadano sube comprobante + monto contra un concepto. El tesorero
 * revisa y aprueba/rechaza. Los pagos aprobados suman al saldo.
 *
 * `receiptR2Key`: path en Cloudflare R2 (bucket `RECEIPTS_BUCKET`).
 * `rateId`: congela la tasa vigente al momento del pago para trazabilidad.
 * Pagos rechazados pueden ser editados por el ciudadano y volver a `pending`.
 */
export const treasuryPayments = sqliteTable(
  "treasury_payments",
  {
    ...baseColumns,
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    conceptId: text("concept_id").references(() => treasuryConcepts.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    amountBsCents: integer("amount_bs_cents").notNull(),
    amountUsdCents: integer("amount_usd_cents").notNull(),
    rateId: text("rate_id")
      .notNull()
      .references(() => treasuryRates.id, { onDelete: "restrict" }),
    receiptR2Key: text("receipt_r2_key").notNull(),
    status: text("status", {
      enum: ["pending", "approved", "rejected"],
    })
      .default("pending")
      .notNull(),
    reviewNotes: text("review_notes"),
    reviewedBy: text("reviewed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    submittedAt: integer("submitted_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index("treasury_payments_user_idx").on(table.userId),
    index("treasury_payments_status_idx").on(table.status),
  ]
);

// ═══════════════════════════════════════════════════════════════
// EGRESOS (registrados por tesorero, sin workflow)
// ═══════════════════════════════════════════════════════════════

/**
 * Registrados directo por el tesorero con comprobante (opcional). Sin flujo
 * de aprobación. Restan del saldo al momento de crearse.
 */
export const treasuryExpenses = sqliteTable("treasury_expenses", {
  ...baseColumns,
  categoryId: text("category_id")
    .notNull()
    .references(() => treasuryCategories.id, { onDelete: "restrict" }),
  description: text("description").notNull(),
  beneficiary: text("beneficiary"),
  amountBsCents: integer("amount_bs_cents").notNull(),
  amountUsdCents: integer("amount_usd_cents").notNull(),
  rateId: text("rate_id")
    .notNull()
    .references(() => treasuryRates.id, { onDelete: "restrict" }),
  receiptR2Key: text("receipt_r2_key"),
  spentAt: integer("spent_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  registeredBy: text("registered_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
});

// ═══════════════════════════════════════════════════════════════
// RELACIONES
// ═══════════════════════════════════════════════════════════════

export const treasuryCategoriesRelations = relations(
  treasuryCategories,
  ({ many }) => ({
    concepts: many(treasuryConcepts),
    expenses: many(treasuryExpenses),
  })
);

export const treasuryConceptsRelations = relations(
  treasuryConcepts,
  ({ one, many }) => ({
    category: one(treasuryCategories, {
      fields: [treasuryConcepts.categoryId],
      references: [treasuryCategories.id],
    }),
    creator: one(user, {
      fields: [treasuryConcepts.createdBy],
      references: [user.id],
    }),
    payments: many(treasuryPayments),
  })
);

export const treasuryRatesRelations = relations(treasuryRates, ({ one }) => ({
  creator: one(user, {
    fields: [treasuryRates.createdBy],
    references: [user.id],
  }),
}));

export const treasuryPaymentsRelations = relations(
  treasuryPayments,
  ({ one }) => ({
    payer: one(user, {
      fields: [treasuryPayments.userId],
      references: [user.id],
      relationName: "payer",
    }),
    concept: one(treasuryConcepts, {
      fields: [treasuryPayments.conceptId],
      references: [treasuryConcepts.id],
    }),
    rate: one(treasuryRates, {
      fields: [treasuryPayments.rateId],
      references: [treasuryRates.id],
    }),
    reviewer: one(user, {
      fields: [treasuryPayments.reviewedBy],
      references: [user.id],
      relationName: "reviewer",
    }),
  })
);

export const treasuryExpensesRelations = relations(
  treasuryExpenses,
  ({ one }) => ({
    category: one(treasuryCategories, {
      fields: [treasuryExpenses.categoryId],
      references: [treasuryCategories.id],
    }),
    rate: one(treasuryRates, {
      fields: [treasuryExpenses.rateId],
      references: [treasuryRates.id],
    }),
    registrar: one(user, {
      fields: [treasuryExpenses.registeredBy],
      references: [user.id],
    }),
  })
);

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export type TreasuryCategory = typeof treasuryCategories.$inferSelect;
export type NewTreasuryCategory = typeof treasuryCategories.$inferInsert;

export type TreasuryConcept = typeof treasuryConcepts.$inferSelect;
export type NewTreasuryConcept = typeof treasuryConcepts.$inferInsert;

export type TreasuryRate = typeof treasuryRates.$inferSelect;
export type NewTreasuryRate = typeof treasuryRates.$inferInsert;

export type TreasuryPayment = typeof treasuryPayments.$inferSelect;
export type NewTreasuryPayment = typeof treasuryPayments.$inferInsert;

export type TreasuryExpense = typeof treasuryExpenses.$inferSelect;
export type NewTreasuryExpense = typeof treasuryExpenses.$inferInsert;
