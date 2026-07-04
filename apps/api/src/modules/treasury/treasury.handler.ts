/**
 * Handler de Tesorería — lógica de negocio.
 *
 * Todos los montos internos viajan en centavos (enteros). La conversión a/desde
 * string decimal sucede en los bordes (DTO input, response mapping).
 * La tasa Bs/USD se congela por transacción vía FK a `treasury_rates`.
 *
 * @module modules/treasury/handler
 */

import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "../../shared/database/schemas";
import {
  treasuryCategories,
  treasuryConcepts,
  treasuryRates,
  treasuryPayments,
  treasuryExpenses,
} from "../../shared/database/schemas/treasury.schema";
import { toCents } from "../../shared/utils/money.util";
import {
  deleteReceipt,
  uploadReceipt,
} from "../../shared/utils/receipt-storage.util";
import {
  TreasuryConflictError,
  TreasuryError,
  TreasuryForbiddenError,
  TreasuryNotFoundError,
} from "./treasury.errors";
import type {
  CreateCategoryInput,
  CreateConceptInput,
  CreateExpenseInput,
  CreatePaymentInput,
  ListExpensesQuery,
  ListPaymentsQuery,
  ReviewPaymentInput,
  SetRateInput,
  UpdateCategoryInput,
  UpdateConceptInput,
  UpdateExpenseInput,
  UpdatePaymentInput,
} from "./dto";

type Database = DrizzleD1Database<typeof schema>;

// ═══════════════════════════════════════════════════════════════
// CATEGORÍAS
// ═══════════════════════════════════════════════════════════════

export async function createCategory(
  db: Database,
  data: CreateCategoryInput
) {
  const existing = await db
    .select()
    .from(treasuryCategories)
    .where(eq(treasuryCategories.key, data.key))
    .get();
  if (existing) {
    throw new TreasuryConflictError(
      `Ya existe una categoría con clave "${data.key}"`
    );
  }
  const [row] = await db
    .insert(treasuryCategories)
    .values({
      key: data.key,
      name: data.name,
      description: data.description ?? null,
      kind: data.kind,
      isActive: data.isActive,
    })
    .returning();
  return row;
}

export async function listCategories(db: Database) {
  return db
    .select()
    .from(treasuryCategories)
    .orderBy(treasuryCategories.name)
    .all();
}

export async function updateCategory(
  db: Database,
  id: string,
  data: UpdateCategoryInput
) {
  const current = await db
    .select()
    .from(treasuryCategories)
    .where(eq(treasuryCategories.id, id))
    .get();
  if (!current) throw new TreasuryNotFoundError("Categoría", id);

  const [row] = await db
    .update(treasuryCategories)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.kind !== undefined && { kind: data.kind }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    })
    .where(eq(treasuryCategories.id, id))
    .returning();
  return row;
}

export async function deleteCategory(db: Database, id: string) {
  const inUseConcept = await db
    .select({ n: sql<number>`count(*)` })
    .from(treasuryConcepts)
    .where(eq(treasuryConcepts.categoryId, id))
    .get();
  const inUseExpense = await db
    .select({ n: sql<number>`count(*)` })
    .from(treasuryExpenses)
    .where(eq(treasuryExpenses.categoryId, id))
    .get();
  if ((inUseConcept?.n ?? 0) + (inUseExpense?.n ?? 0) > 0) {
    throw new TreasuryConflictError(
      "No se puede eliminar la categoría: tiene conceptos o egresos asociados"
    );
  }
  await db.delete(treasuryCategories).where(eq(treasuryCategories.id, id)).run();
}

// ═══════════════════════════════════════════════════════════════
// CONCEPTOS
// ═══════════════════════════════════════════════════════════════

export async function createConcept(
  db: Database,
  data: CreateConceptInput,
  createdBy: string
) {
  const category = await db
    .select()
    .from(treasuryCategories)
    .where(eq(treasuryCategories.id, data.categoryId))
    .get();
  if (!category) throw new TreasuryNotFoundError("Categoría", data.categoryId);

  const existing = await db
    .select()
    .from(treasuryConcepts)
    .where(eq(treasuryConcepts.key, data.key))
    .get();
  if (existing) {
    throw new TreasuryConflictError(
      `Ya existe un concepto con clave "${data.key}"`
    );
  }

  const [row] = await db
    .insert(treasuryConcepts)
    .values({
      key: data.key,
      name: data.name,
      description: data.description ?? null,
      categoryId: data.categoryId,
      defaultBsCents:
        data.defaultAmountBs != null ? toCents(data.defaultAmountBs) : null,
      defaultUsdCents:
        data.defaultAmountUsd != null ? toCents(data.defaultAmountUsd) : null,
      validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      isActive: data.isActive,
      createdBy,
    })
    .returning();
  return row;
}

export async function listConcepts(db: Database, activeOnly: boolean) {
  const rows = activeOnly
    ? await db
        .select()
        .from(treasuryConcepts)
        .where(eq(treasuryConcepts.isActive, true))
        .orderBy(desc(treasuryConcepts.validFrom))
        .all()
    : await db
        .select()
        .from(treasuryConcepts)
        .orderBy(desc(treasuryConcepts.validFrom))
        .all();
  return rows;
}

export async function updateConcept(
  db: Database,
  id: string,
  data: UpdateConceptInput
) {
  const current = await db
    .select()
    .from(treasuryConcepts)
    .where(eq(treasuryConcepts.id, id))
    .get();
  if (!current) throw new TreasuryNotFoundError("Concepto", id);

  const [row] = await db
    .update(treasuryConcepts)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.defaultAmountBs !== undefined && {
        defaultBsCents:
          data.defaultAmountBs == null ? null : toCents(data.defaultAmountBs),
      }),
      ...(data.defaultAmountUsd !== undefined && {
        defaultUsdCents:
          data.defaultAmountUsd == null ? null : toCents(data.defaultAmountUsd),
      }),
      ...(data.validFrom !== undefined && {
        validFrom: new Date(data.validFrom),
      }),
      ...(data.validUntil !== undefined && {
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    })
    .where(eq(treasuryConcepts.id, id))
    .returning();
  return row;
}

export async function deleteConcept(db: Database, id: string) {
  const inUse = await db
    .select({ n: sql<number>`count(*)` })
    .from(treasuryPayments)
    .where(eq(treasuryPayments.conceptId, id))
    .get();
  if ((inUse?.n ?? 0) > 0) {
    // Soft-delete: solo desactivar. Preservamos histórico de pagos.
    await db
      .update(treasuryConcepts)
      .set({ isActive: false })
      .where(eq(treasuryConcepts.id, id))
      .run();
    return { softDeleted: true };
  }
  await db.delete(treasuryConcepts).where(eq(treasuryConcepts.id, id)).run();
  return { softDeleted: false };
}

// ═══════════════════════════════════════════════════════════════
// TASA DE CAMBIO
// ═══════════════════════════════════════════════════════════════

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function setRate(
  db: Database,
  data: SetRateInput,
  createdBy: string
) {
  const date = data.date ?? todayIsoDate();
  const bsPerUsd = data.bsPerUsd.replace(",", ".");
  if (Number.parseFloat(bsPerUsd) <= 0) {
    throw new TreasuryError("La tasa debe ser mayor a cero");
  }

  const existing = await db
    .select()
    .from(treasuryRates)
    .where(eq(treasuryRates.date, date))
    .get();

  if (existing) {
    const [row] = await db
      .update(treasuryRates)
      .set({ bsPerUsd, createdBy })
      .where(eq(treasuryRates.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(treasuryRates)
    .values({ date, bsPerUsd, createdBy })
    .returning();
  return row;
}

export async function getTodayRate(db: Database) {
  const today = todayIsoDate();
  const row = await db
    .select()
    .from(treasuryRates)
    .where(eq(treasuryRates.date, today))
    .get();
  return row ?? null;
}

async function requireTodayRate(db: Database) {
  const rate = await getTodayRate(db);
  if (!rate) {
    throw new TreasuryError(
      "No hay tasa Bs/USD publicada para hoy. Contacte al tesorero.",
      409
    );
  }
  return rate;
}

// ═══════════════════════════════════════════════════════════════
// PAGOS
// ═══════════════════════════════════════════════════════════════

interface CreatePaymentArgs {
  db: Database;
  bucket: R2Bucket | undefined;
  userId: string;
  input: CreatePaymentInput;
  receipt: File;
}

export async function createPayment({
  db,
  bucket,
  userId,
  input,
  receipt,
}: CreatePaymentArgs) {
  if (input.conceptId) {
    const concept = await db
      .select()
      .from(treasuryConcepts)
      .where(eq(treasuryConcepts.id, input.conceptId))
      .get();
    if (!concept) throw new TreasuryNotFoundError("Concepto", input.conceptId);
    if (!concept.isActive) {
      throw new TreasuryError("El concepto está desactivado", 409);
    }
  }

  const rate = await requireTodayRate(db);
  const receiptR2Key = await uploadReceipt(bucket, receipt, {
    kind: "payment",
    userId,
  });

  try {
    const [row] = await db
      .insert(treasuryPayments)
      .values({
        userId,
        conceptId: input.conceptId ?? null,
        description: input.description ?? null,
        amountBsCents: toCents(input.amountBs),
        amountUsdCents: toCents(input.amountUsd),
        rateId: rate.id,
        receiptR2Key,
        status: "pending",
      })
      .returning();
    return row;
  } catch (err) {
    // Rollback del comprobante si el insert falla
    await deleteReceipt(bucket, receiptR2Key);
    throw err;
  }
}

export async function listMyPayments(db: Database, userId: string) {
  return db
    .select()
    .from(treasuryPayments)
    .where(eq(treasuryPayments.userId, userId))
    .orderBy(desc(treasuryPayments.submittedAt))
    .all();
}

export async function getPaymentById(
  db: Database,
  id: string
): Promise<schema.TreasuryPayment> {
  const row = await db
    .select()
    .from(treasuryPayments)
    .where(eq(treasuryPayments.id, id))
    .get();
  if (!row) throw new TreasuryNotFoundError("Pago", id);
  return row;
}

interface UpdatePaymentArgs {
  db: Database;
  bucket: R2Bucket | undefined;
  userId: string;
  paymentId: string;
  input: UpdatePaymentInput;
  receipt?: File;
}

export async function updateRejectedPayment({
  db,
  bucket,
  userId,
  paymentId,
  input,
  receipt,
}: UpdatePaymentArgs) {
  const current = await getPaymentById(db, paymentId);
  if (current.userId !== userId) {
    throw new TreasuryForbiddenError("No puede editar pagos de otros usuarios");
  }
  if (current.status !== "rejected") {
    throw new TreasuryError(
      "Solo se pueden editar pagos rechazados",
      409
    );
  }

  if (input.conceptId) {
    const concept = await db
      .select()
      .from(treasuryConcepts)
      .where(eq(treasuryConcepts.id, input.conceptId))
      .get();
    if (!concept) throw new TreasuryNotFoundError("Concepto", input.conceptId);
    if (!concept.isActive) {
      throw new TreasuryError("El concepto está desactivado", 409);
    }
  }

  const rate = await requireTodayRate(db);
  let receiptR2Key = current.receiptR2Key;
  const previousKey = current.receiptR2Key;

  if (receipt) {
    receiptR2Key = await uploadReceipt(bucket, receipt, {
      kind: "payment",
      userId,
    });
  }

  try {
    const [row] = await db
      .update(treasuryPayments)
      .set({
        ...(input.conceptId !== undefined && { conceptId: input.conceptId }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.amountBs !== undefined && {
          amountBsCents: toCents(input.amountBs),
        }),
        ...(input.amountUsd !== undefined && {
          amountUsdCents: toCents(input.amountUsd),
        }),
        rateId: rate.id,
        receiptR2Key,
        status: "pending",
        reviewNotes: null,
        reviewedBy: null,
        reviewedAt: null,
        submittedAt: new Date(),
      })
      .where(eq(treasuryPayments.id, paymentId))
      .returning();

    if (receipt && previousKey !== receiptR2Key) {
      await deleteReceipt(bucket, previousKey);
    }
    return row;
  } catch (err) {
    if (receipt && receiptR2Key !== previousKey) {
      await deleteReceipt(bucket, receiptR2Key);
    }
    throw err;
  }
}

export async function listPayments(db: Database, q: ListPaymentsQuery) {
  const conds = [] as ReturnType<typeof eq>[];
  if (q.status) conds.push(eq(treasuryPayments.status, q.status));
  if (q.conceptId) conds.push(eq(treasuryPayments.conceptId, q.conceptId));
  const whereClause = conds.length ? and(...conds) : undefined;

  const offset = (q.page - 1) * q.limit;
  const rows = await db
    .select()
    .from(treasuryPayments)
    .where(whereClause)
    .orderBy(desc(treasuryPayments.submittedAt))
    .limit(q.limit)
    .offset(offset)
    .all();

  const totalRow = await db
    .select({ n: sql<number>`count(*)` })
    .from(treasuryPayments)
    .where(whereClause)
    .get();

  return { rows, total: totalRow?.n ?? 0 };
}

export async function reviewPayment(
  db: Database,
  paymentId: string,
  input: ReviewPaymentInput,
  reviewerId: string
) {
  const current = await getPaymentById(db, paymentId);
  if (current.status !== "pending") {
    throw new TreasuryError(
      `El pago ya está ${current.status}. Solo se pueden revisar pagos pendientes.`,
      409
    );
  }

  const [row] = await db
    .update(treasuryPayments)
    .set({
      status: input.action === "approve" ? "approved" : "rejected",
      reviewNotes: input.notes ?? null,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    })
    .where(eq(treasuryPayments.id, paymentId))
    .returning();
  return row;
}

// ═══════════════════════════════════════════════════════════════
// EGRESOS
// ═══════════════════════════════════════════════════════════════

interface CreateExpenseArgs {
  db: Database;
  bucket: R2Bucket | undefined;
  registeredBy: string;
  input: CreateExpenseInput;
  receipt?: File;
}

export async function createExpense({
  db,
  bucket,
  registeredBy,
  input,
  receipt,
}: CreateExpenseArgs) {
  const category = await db
    .select()
    .from(treasuryCategories)
    .where(eq(treasuryCategories.id, input.categoryId))
    .get();
  if (!category) throw new TreasuryNotFoundError("Categoría", input.categoryId);

  const rate = await requireTodayRate(db);
  const receiptR2Key = receipt
    ? await uploadReceipt(bucket, receipt, { kind: "expense" })
    : null;

  try {
    const [row] = await db
      .insert(treasuryExpenses)
      .values({
        categoryId: input.categoryId,
        description: input.description,
        beneficiary: input.beneficiary ?? null,
        amountBsCents: toCents(input.amountBs),
        amountUsdCents: toCents(input.amountUsd),
        rateId: rate.id,
        receiptR2Key,
        spentAt: input.spentAt ? new Date(input.spentAt) : new Date(),
        registeredBy,
      })
      .returning();
    return row;
  } catch (err) {
    if (receiptR2Key) await deleteReceipt(bucket, receiptR2Key);
    throw err;
  }
}

export async function listExpenses(db: Database, q: ListExpensesQuery) {
  const whereClause = q.categoryId
    ? eq(treasuryExpenses.categoryId, q.categoryId)
    : undefined;

  const offset = (q.page - 1) * q.limit;
  const rows = await db
    .select()
    .from(treasuryExpenses)
    .where(whereClause)
    .orderBy(desc(treasuryExpenses.spentAt))
    .limit(q.limit)
    .offset(offset)
    .all();

  const totalRow = await db
    .select({ n: sql<number>`count(*)` })
    .from(treasuryExpenses)
    .where(whereClause)
    .get();

  return { rows, total: totalRow?.n ?? 0 };
}

export async function updateExpense(
  db: Database,
  id: string,
  data: UpdateExpenseInput
) {
  const current = await db
    .select()
    .from(treasuryExpenses)
    .where(eq(treasuryExpenses.id, id))
    .get();
  if (!current) throw new TreasuryNotFoundError("Egreso", id);

  const [row] = await db
    .update(treasuryExpenses)
    .set({
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.beneficiary !== undefined && { beneficiary: data.beneficiary }),
      ...(data.amountBs !== undefined && {
        amountBsCents: toCents(data.amountBs),
      }),
      ...(data.amountUsd !== undefined && {
        amountUsdCents: toCents(data.amountUsd),
      }),
      ...(data.spentAt !== undefined && { spentAt: new Date(data.spentAt) }),
    })
    .where(eq(treasuryExpenses.id, id))
    .returning();
  return row;
}

export async function deleteExpense(
  db: Database,
  bucket: R2Bucket | undefined,
  id: string
) {
  const current = await db
    .select()
    .from(treasuryExpenses)
    .where(eq(treasuryExpenses.id, id))
    .get();
  if (!current) throw new TreasuryNotFoundError("Egreso", id);
  await db.delete(treasuryExpenses).where(eq(treasuryExpenses.id, id)).run();
  if (current.receiptR2Key) await deleteReceipt(bucket, current.receiptR2Key);
}

// ═══════════════════════════════════════════════════════════════
// TRANSPARENCIA (agregado por categoría, sin identificar pagadores)
// ═══════════════════════════════════════════════════════════════

export async function transparencySummary(db: Database) {
  const approvedIncome = await db
    .select({
      categoryId: treasuryConcepts.categoryId,
      bs: sql<number>`sum(${treasuryPayments.amountBsCents})`,
      usd: sql<number>`sum(${treasuryPayments.amountUsdCents})`,
      count: sql<number>`count(*)`,
    })
    .from(treasuryPayments)
    .leftJoin(
      treasuryConcepts,
      eq(treasuryPayments.conceptId, treasuryConcepts.id)
    )
    .where(eq(treasuryPayments.status, "approved"))
    .groupBy(treasuryConcepts.categoryId)
    .all();

  const expenseByCategory = await db
    .select({
      categoryId: treasuryExpenses.categoryId,
      bs: sql<number>`sum(${treasuryExpenses.amountBsCents})`,
      usd: sql<number>`sum(${treasuryExpenses.amountUsdCents})`,
      count: sql<number>`count(*)`,
    })
    .from(treasuryExpenses)
    .groupBy(treasuryExpenses.categoryId)
    .all();

  const categories = await db.select().from(treasuryCategories).all();
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const income = approvedIncome.map((r) => ({
    categoryId: r.categoryId,
    categoryName: r.categoryId
      ? (catMap.get(r.categoryId)?.name ?? "Sin categoría")
      : "Sin categoría",
    bsCents: Number(r.bs ?? 0),
    usdCents: Number(r.usd ?? 0),
    count: Number(r.count ?? 0),
  }));
  const expenses = expenseByCategory.map((r) => ({
    categoryId: r.categoryId,
    categoryName: catMap.get(r.categoryId)?.name ?? "Sin categoría",
    bsCents: Number(r.bs ?? 0),
    usdCents: Number(r.usd ?? 0),
    count: Number(r.count ?? 0),
  }));

  const totalIncomeBs = income.reduce((s, r) => s + r.bsCents, 0);
  const totalIncomeUsd = income.reduce((s, r) => s + r.usdCents, 0);
  const totalExpenseBs = expenses.reduce((s, r) => s + r.bsCents, 0);
  const totalExpenseUsd = expenses.reduce((s, r) => s + r.usdCents, 0);

  return {
    balance: {
      bsCents: totalIncomeBs - totalExpenseBs,
      usdCents: totalIncomeUsd - totalExpenseUsd,
    },
    totals: {
      income: { bsCents: totalIncomeBs, usdCents: totalIncomeUsd },
      expense: { bsCents: totalExpenseBs, usdCents: totalExpenseUsd },
    },
    byCategory: { income, expenses },
  };
}
