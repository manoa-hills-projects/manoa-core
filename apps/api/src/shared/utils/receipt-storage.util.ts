/**
 * Storage de comprobantes (R2).
 *
 * Convención de keys:
 *   receipts/payments/{userId}/{YYYY-MM}/{uuid}.{ext}
 *   receipts/expenses/{YYYY-MM}/{uuid}.{ext}
 *
 * El Worker sube directo desde multipart y sirve stream de vuelta al frontend
 * (no hay presign nativo en el binding R2). Autorización de acceso: el caller
 * verifica ownership antes de invocar `getReceipt`.
 *
 * @module utils/receipt-storage
 */

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = /^image\/(jpe?g|png|webp|heic|heif)$/i;

export class ReceiptValidationError extends Error {
  status = 400 as const;
  constructor(message: string) {
    super(message);
    this.name = "ReceiptValidationError";
  }
}

export class ReceiptStorageUnavailableError extends Error {
  status = 503 as const;
  constructor() {
    super(
      "Storage de comprobantes no está configurado. Contacte al administrador."
    );
    this.name = "ReceiptStorageUnavailableError";
  }
}

/**
 * Sube un archivo a R2 y devuelve la key generada.
 */
export async function uploadReceipt(
  bucket: R2Bucket | undefined,
  file: File,
  scope: { kind: "payment"; userId: string } | { kind: "expense" }
): Promise<string> {
  if (!bucket) throw new ReceiptStorageUnavailableError();

  if (file.size === 0) {
    throw new ReceiptValidationError("El comprobante está vacío");
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    throw new ReceiptValidationError(
      `El comprobante excede el tamaño máximo de ${MAX_RECEIPT_BYTES / 1024 / 1024} MB`
    );
  }
  if (!ALLOWED_MIME.test(file.type)) {
    throw new ReceiptValidationError(
      `Formato no soportado (${file.type || "desconocido"}). Use JPG, PNG, WebP o HEIC.`
    );
  }

  const ext = extensionFromMime(file.type) ?? "bin";
  const yearMonth = formatYearMonth(new Date());
  const uuid = crypto.randomUUID();
  const key =
    scope.kind === "payment"
      ? `receipts/payments/${scope.userId}/${yearMonth}/${uuid}.${ext}`
      : `receipts/expenses/${yearMonth}/${uuid}.${ext}`;

  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return key;
}

/**
 * Descarga un comprobante desde R2. El caller es responsable del owner check.
 */
export async function getReceipt(
  bucket: R2Bucket | undefined,
  key: string
): Promise<R2ObjectBody | null> {
  if (!bucket) throw new ReceiptStorageUnavailableError();
  return await bucket.get(key);
}

/**
 * Elimina un comprobante de R2 (best-effort).
 */
export async function deleteReceipt(
  bucket: R2Bucket | undefined,
  key: string
): Promise<void> {
  if (!bucket) return;
  await bucket.delete(key);
}

function extensionFromMime(mime: string): string | null {
  const lower = mime.toLowerCase();
  if (lower === "image/jpeg" || lower === "image/jpg") return "jpg";
  if (lower === "image/png") return "png";
  if (lower === "image/webp") return "webp";
  if (lower === "image/heic") return "heic";
  if (lower === "image/heif") return "heif";
  return null;
}

function formatYearMonth(date: Date): string {
  const year = date.getUTCFullYear().toString();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}
