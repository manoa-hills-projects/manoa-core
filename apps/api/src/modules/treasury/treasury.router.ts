/**
 * Router de Tesorería.
 *
 * Zonas:
 * - Zona 1/2 (solo `requireAuth` en el mount): categorías/conceptos/tasa GET,
 *   crear pago (ciudadano), listar/editar los pagos propios, ver transparencia,
 *   descargar comprobantes propios.
 * - Zona 3 tesorería (`requirePermission(MODULES.TREASURY)`): CRUD de
 *   categorías, conceptos, tasa, egresos.
 * - Zona 3 pagos (`requirePermission(MODULES.PAYMENTS)`): listar todos los
 *   pagos, revisar (aprobar/rechazar).
 *
 * @module modules/treasury/router
 */

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { HonoConfig } from "../../index";
import { MODULES } from "../../shared/constants";
import { requirePermission } from "../../shared/utils/permissions.middleware";
import { buildPaginatedData, buildSingleData } from "../../shared/utils/api-reponse";
import { BcvRateFetchError } from "../../shared/utils/bcv-rate.util";
import {
  ReceiptStorageUnavailableError,
  ReceiptValidationError,
  getReceipt,
} from "../../shared/utils/receipt-storage.util";
import {
  createCategoryDto,
  createConceptDto,
  createExpenseDto,
  listConceptsQueryDto,
  listExpensesQueryDto,
  listPaymentsQueryDto,
  reviewPaymentDto,
  setRateDto,
  updateCategoryDto,
  updateConceptDto,
  updateExpenseDto,
} from "./dto";
import {
  TreasuryError,
  TreasuryConflictError,
  TreasuryForbiddenError,
  TreasuryNotFoundError,
} from "./treasury.errors";
import {
  createCategory,
  createConcept,
  createExpense,
  createPayment,
  deleteCategory,
  deleteConcept,
  deleteExpense,
  fetchAndPublishBcvRate,
  getPaymentById,
  getTodayRate,
  listCategories,
  listConcepts,
  listExpenses,
  listMyPayments,
  listPayments,
  reviewPayment,
  setRate,
  transparencySummary,
  updateCategory,
  updateConcept,
  updateExpense,
  updateRejectedPayment,
} from "./treasury.handler";

const treasuryRouter = new Hono<HonoConfig>();

type SessionUser = { user?: { id: string } } | null | undefined;
// biome-ignore lint/suspicious/noExplicitAny: Context type varies con middlewares
const getSessionUserId = (c: any): string | null => {
  const session = c.get("session") as SessionUser;
  return session?.user?.id ?? null;
};

// ═══════════════════════════════════════════════════════════════
// TRANSPARENCIA
// ═══════════════════════════════════════════════════════════════

treasuryRouter.get("/transparency", async (c) => {
  try {
    const db = c.get("db");
    const summary = await transparencySummary(db);
    return c.json(buildSingleData(summary));
  } catch (error) {
    return handleError(c, error);
  }
});

// ═══════════════════════════════════════════════════════════════
// CATEGORÍAS
// ═══════════════════════════════════════════════════════════════

treasuryRouter.get("/categories", async (c) => {
  try {
    const db = c.get("db");
    return c.json(buildSingleData(await listCategories(db)));
  } catch (error) {
    return handleError(c, error);
  }
});

treasuryRouter.post(
  "/categories",
  requirePermission(MODULES.TREASURY),
  zValidator("json", createCategoryDto),
  async (c) => {
    try {
      const db = c.get("db");
      const data = c.req.valid("json");
      const created = await createCategory(db, data);
      return c.json(buildSingleData(created), 201);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

treasuryRouter.patch(
  "/categories/:id",
  requirePermission(MODULES.TREASURY),
  zValidator("json", updateCategoryDto),
  async (c) => {
    try {
      const db = c.get("db");
      const id = c.req.param("id");
      const data = c.req.valid("json");
      const updated = await updateCategory(db, id, data);
      return c.json(buildSingleData(updated));
    } catch (error) {
      return handleError(c, error);
    }
  }
);

treasuryRouter.delete(
  "/categories/:id",
  requirePermission(MODULES.TREASURY),
  async (c) => {
    try {
      const db = c.get("db");
      await deleteCategory(db, c.req.param("id"));
      return c.body(null, 204);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// CONCEPTOS
// ═══════════════════════════════════════════════════════════════

treasuryRouter.get(
  "/concepts",
  zValidator("query", listConceptsQueryDto),
  async (c) => {
    try {
      const db = c.get("db");
      const { activeOnly } = c.req.valid("query");
      return c.json(buildSingleData(await listConcepts(db, activeOnly)));
    } catch (error) {
      return handleError(c, error);
    }
  }
);

treasuryRouter.post(
  "/concepts",
  requirePermission(MODULES.TREASURY),
  zValidator("json", createConceptDto),
  async (c) => {
    try {
      const db = c.get("db");
      const userId = getSessionUserId(c);
      if (!userId) return c.json({ error: "No autorizado" }, 401);
      const created = await createConcept(
        db,
        c.req.valid("json"),
        userId
      );
      return c.json(buildSingleData(created), 201);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

treasuryRouter.patch(
  "/concepts/:id",
  requirePermission(MODULES.TREASURY),
  zValidator("json", updateConceptDto),
  async (c) => {
    try {
      const db = c.get("db");
      const updated = await updateConcept(
        db,
        c.req.param("id"),
        c.req.valid("json")
      );
      return c.json(buildSingleData(updated));
    } catch (error) {
      return handleError(c, error);
    }
  }
);

treasuryRouter.delete(
  "/concepts/:id",
  requirePermission(MODULES.TREASURY),
  async (c) => {
    try {
      const db = c.get("db");
      const result = await deleteConcept(db, c.req.param("id"));
      return c.json(buildSingleData(result));
    } catch (error) {
      return handleError(c, error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// TASA DE CAMBIO
// ═══════════════════════════════════════════════════════════════

treasuryRouter.get("/rates/today", async (c) => {
  try {
    const db = c.get("db");
    return c.json(buildSingleData(await getTodayRate(db)));
  } catch (error) {
    return handleError(c, error);
  }
});

treasuryRouter.post(
  "/rates",
  requirePermission(MODULES.TREASURY),
  zValidator("json", setRateDto),
  async (c) => {
    try {
      const db = c.get("db");
      const userId = getSessionUserId(c);
      if (!userId) return c.json({ error: "No autorizado" }, 401);
      const row = await setRate(db, c.req.valid("json"), userId);
      return c.json(buildSingleData(row), 201);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

treasuryRouter.post(
  "/rates/fetch-bcv",
  requirePermission(MODULES.TREASURY),
  async (c) => {
    try {
      const db = c.get("db");
      const userId = getSessionUserId(c);
      if (!userId) return c.json({ error: "No autorizado" }, 401);
      const result = await fetchAndPublishBcvRate(db, userId);
      return c.json(buildSingleData(result), 201);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// PAGOS (multipart en submit/edit)
// ═══════════════════════════════════════════════════════════════

/**
 * Parsea el body multipart para pagos: campos + `receipt` (File).
 * Los campos numéricos vienen como strings, se validan con el DTO.
 */
// biome-ignore lint/suspicious/noExplicitAny: Context type varies con middlewares
async function parsePaymentMultipart(c: any) {
  const form = await c.req.formData();
  const receipt = form.get("receipt") as File | string | null;
  if (receipt !== null && typeof receipt === "string") {
    throw new ReceiptValidationError("Comprobante inválido");
  }
  const fields = {
    conceptId: (form.get("conceptId") as string) || undefined,
    description: (form.get("description") as string) || undefined,
    amountBs: form.get("amountBs") as string,
    amountUsd: form.get("amountUsd") as string,
  };
  return { fields, receipt: receipt as File | null };
}

const paymentFieldsSchema = z.object({
  conceptId: z.string().min(1).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  amountBs: z.string().regex(/^\d+([.,]\d{1,2})?$/),
  amountUsd: z.string().regex(/^\d+([.,]\d{1,2})?$/),
});

treasuryRouter.post("/payments", async (c) => {
  try {
    const db = c.get("db");
    const userId = getSessionUserId(c);
    if (!userId) return c.json({ error: "No autorizado" }, 401);

    const { fields, receipt } = await parsePaymentMultipart(c);
    if (!receipt) {
      throw new ReceiptValidationError("Falta el comprobante");
    }
    const parsed = paymentFieldsSchema.parse(fields);

    const payment = await createPayment({
      db,
      bucket: c.env.RECEIPTS_BUCKET,
      userId: userId,
      input: parsed,
      receipt,
    });
    return c.json(buildSingleData(payment), 201);
  } catch (error) {
    return handleError(c, error);
  }
});

treasuryRouter.get("/payments/mine", async (c) => {
  try {
    const db = c.get("db");
    const userId = getSessionUserId(c);
    if (!userId) return c.json({ error: "No autorizado" }, 401);
    return c.json(buildSingleData(await listMyPayments(db, userId)));
  } catch (error) {
    return handleError(c, error);
  }
});

treasuryRouter.patch("/payments/:id", async (c) => {
  try {
    const db = c.get("db");
    const userId = getSessionUserId(c);
    if (!userId) return c.json({ error: "No autorizado" }, 401);
    const paymentId = c.req.param("id");
    const { fields, receipt } = await parsePaymentMultipart(c);
    const partial = paymentFieldsSchema.partial().parse(fields);

    const updated = await updateRejectedPayment({
      db,
      bucket: c.env.RECEIPTS_BUCKET,
      userId: userId,
      paymentId,
      input: partial,
      receipt: receipt ?? undefined,
    });
    return c.json(buildSingleData(updated));
  } catch (error) {
    return handleError(c, error);
  }
});

treasuryRouter.get(
  "/payments",
  requirePermission(MODULES.PAYMENTS),
  zValidator("query", listPaymentsQueryDto),
  async (c) => {
    try {
      const db = c.get("db");
      const q = c.req.valid("query");
      const { rows, total } = await listPayments(db, q);
      return c.json(buildPaginatedData(rows, total, q.page, q.limit));
    } catch (error) {
      return handleError(c, error);
    }
  }
);

treasuryRouter.post(
  "/payments/:id/review",
  requirePermission(MODULES.PAYMENTS),
  zValidator("json", reviewPaymentDto),
  async (c) => {
    try {
      const db = c.get("db");
      const userId = getSessionUserId(c);
      if (!userId) return c.json({ error: "No autorizado" }, 401);
      const row = await reviewPayment(
        db,
        c.req.param("id"),
        c.req.valid("json"),
        userId
      );
      return c.json(buildSingleData(row));
    } catch (error) {
      return handleError(c, error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// EGRESOS
// ═══════════════════════════════════════════════════════════════

const expenseFieldsSchema = z.object({
  categoryId: z.string().min(1),
  description: z.string().min(3).max(500),
  beneficiary: z.string().max(160).optional().nullable(),
  amountBs: z.string().regex(/^\d+([.,]\d{1,2})?$/),
  amountUsd: z.string().regex(/^\d+([.,]\d{1,2})?$/),
  spentAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

// biome-ignore lint/suspicious/noExplicitAny: Context type varies con middlewares
async function parseExpenseMultipart(c: any) {
  const form = await c.req.formData();
  const receipt = form.get("receipt") as File | string | null;
  if (receipt !== null && typeof receipt === "string") {
    throw new ReceiptValidationError("Comprobante inválido");
  }
  const fields = {
    categoryId: form.get("categoryId") as string,
    description: form.get("description") as string,
    beneficiary: (form.get("beneficiary") as string) || undefined,
    amountBs: form.get("amountBs") as string,
    amountUsd: form.get("amountUsd") as string,
    spentAt: (form.get("spentAt") as string) || undefined,
  };
  return { fields, receipt: receipt as File | null };
}

treasuryRouter.post(
  "/expenses",
  requirePermission(MODULES.TREASURY),
  async (c) => {
    try {
      const db = c.get("db");
      const userId = getSessionUserId(c);
      if (!userId) return c.json({ error: "No autorizado" }, 401);
      const { fields, receipt } = await parseExpenseMultipart(c);
      const parsed = expenseFieldsSchema.parse(fields);

      const row = await createExpense({
        db,
        bucket: c.env.RECEIPTS_BUCKET,
        registeredBy: userId,
        input: parsed,
        receipt: receipt ?? undefined,
      });
      return c.json(buildSingleData(row), 201);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

treasuryRouter.get(
  "/expenses",
  requirePermission(MODULES.TREASURY),
  zValidator("query", listExpensesQueryDto),
  async (c) => {
    try {
      const db = c.get("db");
      const q = c.req.valid("query");
      const { rows, total } = await listExpenses(db, q);
      return c.json(buildPaginatedData(rows, total, q.page, q.limit));
    } catch (error) {
      return handleError(c, error);
    }
  }
);

treasuryRouter.patch(
  "/expenses/:id",
  requirePermission(MODULES.TREASURY),
  zValidator("json", updateExpenseDto),
  async (c) => {
    try {
      const db = c.get("db");
      const row = await updateExpense(
        db,
        c.req.param("id"),
        c.req.valid("json")
      );
      return c.json(buildSingleData(row));
    } catch (error) {
      return handleError(c, error);
    }
  }
);

treasuryRouter.delete(
  "/expenses/:id",
  requirePermission(MODULES.TREASURY),
  async (c) => {
    try {
      const db = c.get("db");
      await deleteExpense(db, c.env.RECEIPTS_BUCKET, c.req.param("id"));
      return c.body(null, 204);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// COMPROBANTES (stream desde R2 con owner check)
// ═══════════════════════════════════════════════════════════════

/**
 * Descarga un comprobante. Owner check:
 * - Si la key empieza con `receipts/payments/{userId}/`, el owner es ese userId.
 * - En cualquier otro caso, requiere permiso `MODULES.PAYMENTS` o `MODULES.TREASURY`.
 */
treasuryRouter.get("/receipts/*", async (c) => {
  try {
    const userId = getSessionUserId(c);
    if (!userId) return c.json({ error: "No autorizado" }, 401);

    const url = new URL(c.req.url);
    const prefix = "/receipts/";
    const idx = url.pathname.indexOf(prefix);
    const key = url.pathname.slice(idx + prefix.length);

    if (!key.startsWith("receipts/")) {
      return c.json({ error: "Key inválida" }, 400);
    }

    const paymentPrefix = `receipts/payments/${userId}/`;
    const isOwner = key.startsWith(paymentPrefix);

    if (!isOwner) {
      const db = c.get("db");
      const { getUserPermissions } = await import(
        "../../shared/utils/permissions.middleware"
      );
      const perms = await getUserPermissions(
        db,
        c.env.PERMISSIONS_CACHE,
        userId
      );
      const isTreasurer =
        perms?.profileKey === "super_admin" ||
        perms?.allowedModules.has(MODULES.PAYMENTS) ||
        perms?.allowedModules.has(MODULES.TREASURY);
      if (!isTreasurer) {
        return c.json({ error: "Acceso denegado" }, 403);
      }
    }

    const object = await getReceipt(c.env.RECEIPTS_BUCKET, key);
    if (!object) return c.json({ error: "Comprobante no encontrado" }, 404);

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "private, max-age=60");
    return new Response(object.body, { headers });
  } catch (error) {
    return handleError(c, error);
  }
});

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLER
// ═══════════════════════════════════════════════════════════════

// biome-ignore lint/suspicious/noExplicitAny: Hono context type varies per route
function handleError(c: any, error: unknown) {
  console.error("[treasury-router] Error:", error);

  if (error instanceof TreasuryNotFoundError) {
    return c.json({ error: error.message }, 404);
  }
  if (error instanceof TreasuryConflictError) {
    return c.json({ error: error.message }, 409);
  }
  if (error instanceof TreasuryForbiddenError) {
    return c.json({ error: error.message }, 403);
  }
  if (error instanceof ReceiptValidationError) {
    return c.json({ error: error.message }, 400);
  }
  if (error instanceof ReceiptStorageUnavailableError) {
    return c.json({ error: error.message }, 503);
  }
  if (error instanceof BcvRateFetchError) {
    return c.json({ error: error.message }, 502);
  }
  if (error instanceof TreasuryError) {
    return c.json({ error: error.message }, error.status);
  }
  if (error instanceof Error && error.name === "ZodError") {
    return c.json({ error: "Datos inválidos", details: error.message }, 400);
  }
  return c.json(
    {
      error: "Error interno del servidor",
      message: error instanceof Error ? error.message : "Error desconocido",
    },
    500
  );
}

export { treasuryRouter };
