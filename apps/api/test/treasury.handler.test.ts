/**
 * Tests del handler de tesorería.
 *
 * Cubren el ciclo de vida completo: catálogo (categorías + conceptos + tasa),
 * pagos con workflow (submit → review → resubmit rechazados), egresos, y
 * transparencia (saldo agregado). El fake R2 valida que los comprobantes se
 * suben, se persisten y se limpian correctamente.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "../src/shared/database/schemas";
import {
  clearRBACTables,
  clearTreasuryTables,
  clearUsersTable,
  disposeTestDB,
  getTestDB,
} from "./helpers/d1-helper";
import { createFakeR2, type FakeR2 } from "./helpers/fake-r2";
import {
  createCategory,
  createConcept,
  createExpense,
  createPayment,
  deleteConcept,
  getTodayRate,
  listConcepts,
  listExpenses,
  listMyPayments,
  listPayments,
  reviewPayment,
  setRate,
  transparencySummary,
  updateRejectedPayment,
} from "../src/modules/treasury/treasury.handler";
import {
  TreasuryError,
  TreasuryForbiddenError,
} from "../src/modules/treasury/treasury.errors";

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const makeReceipt = (contents = "fake-jpg-bytes", type = "image/jpeg") =>
  new File([contents], "receipt.jpg", { type });

async function createUser(
  db: Awaited<ReturnType<typeof getTestDB>>["db"],
  name: string,
  suffix: string
) {
  const id = crypto.randomUUID();
  await db.insert(schema.user).values({
    id,
    name,
    email: `${suffix}_${Date.now()}@manoa.local`,
    emailVerified: true,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

// ═══════════════════════════════════════════════════════════════
// SUITE
// ═══════════════════════════════════════════════════════════════

describe("Treasury handler", () => {
  let db: Awaited<ReturnType<typeof getTestDB>>["db"];
  let bucket: FakeR2;

  let treasurerId: string;
  let citizenAId: string;
  let citizenBId: string;

  let categoryMaintenanceId: string;
  let categoryFeeId: string;
  let conceptMonthlyFeeId: string;

  beforeAll(async () => {
    const env = await getTestDB();
    db = env.db;
    bucket = createFakeR2();

    treasurerId = await createUser(db, "Tesorero", "treasurer");
    citizenAId = await createUser(db, "Ciudadano A", "citizenA");
    citizenBId = await createUser(db, "Ciudadano B", "citizenB");
  });

  beforeEach(async () => {
    await clearTreasuryTables();
    bucket.clear();

    // Categorías base
    const cat1 = await createCategory(db as any, {
      key: "cuotas",
      name: "Cuotas",
      description: null,
      kind: "income",
      isActive: true,
    });
    categoryFeeId = cat1.id;

    const cat2 = await createCategory(db as any, {
      key: "mantenimiento",
      name: "Mantenimiento",
      description: null,
      kind: "expense",
      isActive: true,
    });
    categoryMaintenanceId = cat2.id;

    // Concepto de prueba
    const concept = await createConcept(
      db as any,
      {
        key: "cuota_enero_2026",
        name: "Cuota Enero 2026",
        description: null,
        categoryId: categoryFeeId,
        defaultAmountBs: "1500.00",
        defaultAmountUsd: "50.00",
        isActive: true,
      },
      treasurerId
    );
    conceptMonthlyFeeId = concept.id;

    // Tasa del día (requerida para pagos y egresos)
    await setRate(
      db as any,
      { bsPerUsd: "30.00" },
      treasurerId
    );
  });

  afterAll(async () => {
    await clearTreasuryTables();
    await clearRBACTables();
    await clearUsersTable();
    await disposeTestDB();
  });

  // ── CATÁLOGO ────────────────────────────────────────────────────

  describe("Catálogo (categorías + conceptos + tasa)", () => {
    it("crea concepto activo y aparece en listConcepts(activeOnly=true)", async () => {
      const concepts = await listConcepts(db as any, true);
      expect(concepts.some((c) => c.id === conceptMonthlyFeeId)).toBe(true);
    });

    it("setRate hace upsert sobre la misma fecha", async () => {
      const first = await getTodayRate(db as any);
      expect(first?.bsPerUsd).toBe("30.00");

      await setRate(db as any, { bsPerUsd: "35.50" }, treasurerId);
      const second = await getTodayRate(db as any);

      expect(second?.id).toBe(first?.id);
      expect(second?.bsPerUsd).toBe("35.50");
    });

    it("deleteConcept hace soft-delete si tiene pagos asociados", async () => {
      // Crear pago que referencia al concepto
      await createPayment({
        db: db as any,
        bucket,
        userId: citizenAId,
        input: {
          conceptId: conceptMonthlyFeeId,
          description: null,
          amountBs: "1500.00",
          amountUsd: "50.00",
        },
        receipt: makeReceipt(),
      });

      const result = await deleteConcept(db as any, conceptMonthlyFeeId);
      expect(result.softDeleted).toBe(true);

      // El concepto sigue existiendo pero desactivado
      const rowsActive = await listConcepts(db as any, true);
      expect(rowsActive.some((c) => c.id === conceptMonthlyFeeId)).toBe(false);

      const rowsAll = await listConcepts(db as any, false);
      expect(rowsAll.some((c) => c.id === conceptMonthlyFeeId)).toBe(true);
    });
  });

  // ── PAGOS ───────────────────────────────────────────────────────

  describe("Pagos — submit del ciudadano", () => {
    it("crea pago con status pending y comprobante en R2", async () => {
      const payment = await createPayment({
        db: db as any,
        bucket,
        userId: citizenAId,
        input: {
          conceptId: conceptMonthlyFeeId,
          description: "Pago mensual",
          amountBs: "1500.00",
          amountUsd: "50.00",
        },
        receipt: makeReceipt(),
      });

      expect(payment.status).toBe("pending");
      expect(payment.userId).toBe(citizenAId);
      expect(payment.amountBsCents).toBe(150000);
      expect(payment.amountUsdCents).toBe(5000);
      expect(payment.receiptR2Key).toMatch(/^receipts\/payments\/[^/]+\//);
      expect(bucket._keys()).toContain(payment.receiptR2Key);
    });

    it("falla si no hay tasa del día publicada", async () => {
      // Borrar la tasa
      await db.delete(schema.treasuryRates).run();

      await expect(
        createPayment({
          db: db as any,
          bucket,
          userId: citizenAId,
          input: {
            conceptId: conceptMonthlyFeeId,
            description: null,
            amountBs: "1500.00",
            amountUsd: "50.00",
          },
          receipt: makeReceipt(),
        })
      ).rejects.toBeInstanceOf(TreasuryError);
    });

    it("rechaza comprobante en formato no soportado", async () => {
      await expect(
        createPayment({
          db: db as any,
          bucket,
          userId: citizenAId,
          input: {
            conceptId: conceptMonthlyFeeId,
            description: null,
            amountBs: "1500.00",
            amountUsd: "50.00",
          },
          receipt: new File(["pdf-data"], "receipt.pdf", {
            type: "application/pdf",
          }),
        })
      ).rejects.toThrow(/Formato no soportado/);

      // No debe quedar comprobante huérfano
      expect(bucket._size()).toBe(0);
    });
  });

  describe("Pagos — listMyPayments", () => {
    it("solo devuelve pagos del propio ciudadano", async () => {
      await createPayment({
        db: db as any,
        bucket,
        userId: citizenAId,
        input: {
          conceptId: conceptMonthlyFeeId,
          description: null,
          amountBs: "1500.00",
          amountUsd: "50.00",
        },
        receipt: makeReceipt(),
      });
      await createPayment({
        db: db as any,
        bucket,
        userId: citizenBId,
        input: {
          conceptId: conceptMonthlyFeeId,
          description: null,
          amountBs: "3000.00",
          amountUsd: "100.00",
        },
        receipt: makeReceipt(),
      });

      const mineA = await listMyPayments(db as any, citizenAId);
      const mineB = await listMyPayments(db as any, citizenBId);

      expect(mineA).toHaveLength(1);
      expect(mineA[0].userId).toBe(citizenAId);
      expect(mineB).toHaveLength(1);
      expect(mineB[0].userId).toBe(citizenBId);
    });
  });

  describe("Pagos — review del tesorero", () => {
    it("aprobar deja el pago en approved y agrega reviewer + fecha", async () => {
      const payment = await createPayment({
        db: db as any,
        bucket,
        userId: citizenAId,
        input: {
          conceptId: conceptMonthlyFeeId,
          description: null,
          amountBs: "1500.00",
          amountUsd: "50.00",
        },
        receipt: makeReceipt(),
      });

      const reviewed = await reviewPayment(
        db as any,
        payment.id,
        { action: "approve", notes: "OK" },
        treasurerId
      );

      expect(reviewed.status).toBe("approved");
      expect(reviewed.reviewedBy).toBe(treasurerId);
      expect(reviewed.reviewedAt).toBeInstanceOf(Date);
      expect(reviewed.reviewNotes).toBe("OK");
    });

    it("rechazar requiere motivo y deja el pago en rejected", async () => {
      const payment = await createPayment({
        db: db as any,
        bucket,
        userId: citizenAId,
        input: {
          conceptId: conceptMonthlyFeeId,
          description: null,
          amountBs: "1500.00",
          amountUsd: "50.00",
        },
        receipt: makeReceipt(),
      });

      const reviewed = await reviewPayment(
        db as any,
        payment.id,
        { action: "reject", notes: "Comprobante ilegible" },
        treasurerId
      );

      expect(reviewed.status).toBe("rejected");
      expect(reviewed.reviewNotes).toBe("Comprobante ilegible");
    });

    it("no permite revisar dos veces el mismo pago", async () => {
      const payment = await createPayment({
        db: db as any,
        bucket,
        userId: citizenAId,
        input: {
          conceptId: conceptMonthlyFeeId,
          description: null,
          amountBs: "1500.00",
          amountUsd: "50.00",
        },
        receipt: makeReceipt(),
      });

      await reviewPayment(
        db as any,
        payment.id,
        { action: "approve", notes: null },
        treasurerId
      );

      await expect(
        reviewPayment(
          db as any,
          payment.id,
          { action: "reject", notes: "Cambio de opinión" },
          treasurerId
        )
      ).rejects.toBeInstanceOf(TreasuryError);
    });
  });

  describe("Pagos — resubmit del ciudadano tras rechazo", () => {
    it("editar pago rechazado con nuevo comprobante lo devuelve a pending", async () => {
      const payment = await createPayment({
        db: db as any,
        bucket,
        userId: citizenAId,
        input: {
          conceptId: conceptMonthlyFeeId,
          description: null,
          amountBs: "1500.00",
          amountUsd: "50.00",
        },
        receipt: makeReceipt("first"),
      });
      const originalKey = payment.receiptR2Key;

      await reviewPayment(
        db as any,
        payment.id,
        { action: "reject", notes: "Ilegible" },
        treasurerId
      );

      const resubmitted = await updateRejectedPayment({
        db: db as any,
        bucket,
        userId: citizenAId,
        paymentId: payment.id,
        input: { amountBs: "1600.00", amountUsd: "55.00" },
        receipt: makeReceipt("second"),
      });

      expect(resubmitted.status).toBe("pending");
      expect(resubmitted.reviewNotes).toBeNull();
      expect(resubmitted.reviewedBy).toBeNull();
      expect(resubmitted.reviewedAt).toBeNull();
      expect(resubmitted.amountBsCents).toBe(160000);
      expect(resubmitted.receiptR2Key).not.toBe(originalKey);

      // El comprobante viejo se borró de R2
      expect(bucket._keys()).not.toContain(originalKey);
      expect(bucket._keys()).toContain(resubmitted.receiptR2Key);
    });

    it("no permite editar pago aprobado", async () => {
      const payment = await createPayment({
        db: db as any,
        bucket,
        userId: citizenAId,
        input: {
          conceptId: conceptMonthlyFeeId,
          description: null,
          amountBs: "1500.00",
          amountUsd: "50.00",
        },
        receipt: makeReceipt(),
      });
      await reviewPayment(
        db as any,
        payment.id,
        { action: "approve", notes: null },
        treasurerId
      );

      await expect(
        updateRejectedPayment({
          db: db as any,
          bucket,
          userId: citizenAId,
          paymentId: payment.id,
          input: { amountBs: "9999.00" },
        })
      ).rejects.toBeInstanceOf(TreasuryError);
    });

    it("no permite editar pago de otro ciudadano", async () => {
      const payment = await createPayment({
        db: db as any,
        bucket,
        userId: citizenAId,
        input: {
          conceptId: conceptMonthlyFeeId,
          description: null,
          amountBs: "1500.00",
          amountUsd: "50.00",
        },
        receipt: makeReceipt(),
      });
      await reviewPayment(
        db as any,
        payment.id,
        { action: "reject", notes: "Test" },
        treasurerId
      );

      await expect(
        updateRejectedPayment({
          db: db as any,
          bucket,
          userId: citizenBId, // No es el dueño
          paymentId: payment.id,
          input: { amountBs: "1600.00" },
        })
      ).rejects.toBeInstanceOf(TreasuryForbiddenError);
    });
  });

  describe("Pagos — listPayments con filtros", () => {
    it("filtra por status y pagina", async () => {
      for (let i = 0; i < 3; i++) {
        const p = await createPayment({
          db: db as any,
          bucket,
          userId: citizenAId,
          input: {
            conceptId: conceptMonthlyFeeId,
            description: null,
            amountBs: `${1000 + i * 100}.00`,
            amountUsd: `${30 + i}.00`,
          },
          receipt: makeReceipt(`p${i}`),
        });
        if (i === 0) {
          await reviewPayment(
            db as any,
            p.id,
            { action: "approve", notes: null },
            treasurerId
          );
        }
      }

      const approved = await listPayments(db as any, {
        status: "approved",
        page: 1,
        limit: 20,
      });
      const pending = await listPayments(db as any, {
        status: "pending",
        page: 1,
        limit: 20,
      });

      expect(approved.rows).toHaveLength(1);
      expect(approved.total).toBe(1);
      expect(pending.rows).toHaveLength(2);
      expect(pending.total).toBe(2);
    });
  });

  // ── EGRESOS ─────────────────────────────────────────────────────

  describe("Egresos", () => {
    it("registra egreso con comprobante opcional", async () => {
      const expense = await createExpense({
        db: db as any,
        bucket,
        registeredBy: treasurerId,
        input: {
          categoryId: categoryMaintenanceId,
          description: "Pintura portón principal",
          beneficiary: "Ferretería Manoa",
          amountBs: "1200.00",
          amountUsd: "40.00",
        },
        receipt: makeReceipt("factura"),
      });

      expect(expense.registeredBy).toBe(treasurerId);
      expect(expense.amountUsdCents).toBe(4000);
      expect(expense.receiptR2Key).toMatch(/^receipts\/expenses\//);
      expect(bucket._keys()).toContain(expense.receiptR2Key);
    });

    it("registra egreso sin comprobante", async () => {
      const expense = await createExpense({
        db: db as any,
        bucket,
        registeredBy: treasurerId,
        input: {
          categoryId: categoryMaintenanceId,
          description: "Efectivo caja chica",
          amountBs: "100.00",
          amountUsd: "3.00",
        },
      });

      expect(expense.receiptR2Key).toBeNull();
    });

    it("listExpenses filtra por categoría y pagina", async () => {
      await createExpense({
        db: db as any,
        bucket,
        registeredBy: treasurerId,
        input: {
          categoryId: categoryMaintenanceId,
          description: "Item A",
          amountBs: "100.00",
          amountUsd: "3.00",
        },
      });
      await createExpense({
        db: db as any,
        bucket,
        registeredBy: treasurerId,
        input: {
          categoryId: categoryMaintenanceId,
          description: "Item B",
          amountBs: "200.00",
          amountUsd: "6.00",
        },
      });

      const result = await listExpenses(db as any, {
        categoryId: categoryMaintenanceId,
        page: 1,
        limit: 20,
      });
      expect(result.total).toBe(2);
    });
  });

  // ── TRANSPARENCIA ───────────────────────────────────────────────

  describe("Transparencia", () => {
    it("calcula saldo neto (aprobados - egresos) y agrega por categoría sin exponer userId", async () => {
      // 2 pagos aprobados a la categoría cuotas
      for (const amount of ["1500.00", "1500.00"]) {
        const p = await createPayment({
          db: db as any,
          bucket,
          userId: citizenAId,
          input: {
            conceptId: conceptMonthlyFeeId,
            description: null,
            amountBs: amount,
            amountUsd: "50.00",
          },
          receipt: makeReceipt(),
        });
        await reviewPayment(
          db as any,
          p.id,
          { action: "approve", notes: null },
          treasurerId
        );
      }

      // 1 pago pendiente que NO debe contar
      await createPayment({
        db: db as any,
        bucket,
        userId: citizenBId,
        input: {
          conceptId: conceptMonthlyFeeId,
          description: null,
          amountBs: "999.00",
          amountUsd: "33.00",
        },
        receipt: makeReceipt(),
      });

      // Egreso mantenimiento
      await createExpense({
        db: db as any,
        bucket,
        registeredBy: treasurerId,
        input: {
          categoryId: categoryMaintenanceId,
          description: "Pintura",
          amountBs: "500.00",
          amountUsd: "17.00",
        },
      });

      const summary = await transparencySummary(db as any);

      // Ingresos = 2 * 50 USD = 10000 cents; Egresos = 17 USD = 1700 cents
      expect(summary.totals.income.usdCents).toBe(10000);
      expect(summary.totals.expense.usdCents).toBe(1700);
      expect(summary.balance.usdCents).toBe(10000 - 1700);
      expect(summary.balance.bsCents).toBe(300000 - 50000);

      const feeAgg = summary.byCategory.income.find(
        (r) => r.categoryId === categoryFeeId
      );
      const maintAgg = summary.byCategory.expenses.find(
        (r) => r.categoryId === categoryMaintenanceId
      );
      expect(feeAgg?.count).toBe(2);
      expect(maintAgg?.count).toBe(1);

      // El resumen no expone userId de los pagadores
      const summaryJson = JSON.stringify(summary);
      expect(summaryJson).not.toContain(citizenAId);
      expect(summaryJson).not.toContain(citizenBId);
    });
  });
});
