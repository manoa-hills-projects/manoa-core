/**
 * Obtiene la tasa oficial USD/Bs desde el BCV.
 *
 * Estrategia (con fallback):
 *   1. Primary: ve.dolarapi.com — aggregator estable que expone la tasa
 *      oficial BCV en JSON limpio. Free, sin auth.
 *   2. Fallback: scrape directo de bcv.org.ve — busca el `<strong class="strong-tb">`
 *      del bloque `<div id="dolar">` de la homepage. Frágil ante cambios de
 *      layout, pero es la fuente oficial cruda.
 *
 * Retorna `{ bsPerUsd, source, fetchedAt }` o lanza `BcvRateFetchError`.
 *
 * @module utils/bcv-rate
 */

export class BcvRateFetchError extends Error {
  status = 502 as const;
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "BcvRateFetchError";
  }
}

export interface BcvRateResult {
  bsPerUsd: string; // decimal con punto, ej "667.05"
  source: "dolarapi" | "bcv-scrape";
  fetchedAt: string; // ISO
}

const FETCH_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Normaliza un número a string con 2-6 decimales, punto decimal.
 * Rechaza <=0 o no-finite.
 */
function normalizeRate(raw: number): string {
  if (!Number.isFinite(raw) || raw <= 0) {
    throw new BcvRateFetchError(`Tasa fuera de rango: ${raw}`);
  }
  const fixed = raw.toFixed(4);
  // Elimina ceros trailing preservando al menos 2 decimales.
  return fixed.replace(/(\.\d{2})0+$/, "$1");
}

// ═══════════════════════════════════════════════════════════════
// Fuente primaria: ve.dolarapi.com (oficial BCV)
// ═══════════════════════════════════════════════════════════════

interface DolarApiResponse {
  moneda?: string;
  fuente?: string;
  promedio?: number;
  compra?: number | null;
  venta?: number | null;
  fechaActualizacion?: string;
}

async function fetchFromDolarApi(): Promise<BcvRateResult> {
  const url = "https://ve.dolarapi.com/v1/dolares/oficial";
  const res = await fetchWithTimeout(url, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new BcvRateFetchError(`ve.dolarapi.com respondió ${res.status}`);
  }
  const data = (await res.json()) as DolarApiResponse;
  const price = data?.promedio ?? data?.venta ?? data?.compra;
  if (typeof price !== "number") {
    throw new BcvRateFetchError("ve.dolarapi.com no devolvió precio USD");
  }
  return {
    bsPerUsd: normalizeRate(price),
    source: "dolarapi",
    fetchedAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// Fuente fallback: scrape bcv.org.ve
// ═══════════════════════════════════════════════════════════════

/**
 * BCV publica la tasa dentro de `<div id="dolar">` en un
 * `<strong class="strong-tb">667,05000000</strong>`. Formato venezolano:
 * coma decimal, sin miles.
 *
 * Buscamos el primer `<strong class="strong-tb">` cerca de `id="dolar"`
 * para no confundirnos con otras tasas del sistema bancario que aparecen
 * más abajo en la home.
 */
async function fetchFromBcvScrape(): Promise<BcvRateResult> {
  const url = "https://www.bcv.org.ve/";
  const res = await fetchWithTimeout(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "manoa-treasury/1.0 (+https://manoa.local)",
    },
  });
  if (!res.ok) {
    throw new BcvRateFetchError(`bcv.org.ve respondió ${res.status}`);
  }
  const html = await res.text();

  // Aislar una ventana amplia después de `id="dolar"` (hasta 4KB) y buscar
  // el primer strong con la tasa dentro de esa ventana.
  const anchorIdx = html.search(/id=["']dolar["']/i);
  if (anchorIdx === -1) {
    throw new BcvRateFetchError("No se encontró bloque `id=dolar` en BCV");
  }
  const window = html.slice(anchorIdx, anchorIdx + 4000);
  const strongMatch = window.match(
    /<strong[^>]*class=["'][^"']*strong-tb[^"']*["'][^>]*>\s*([\d.,]+)\s*<\/strong>/i
  );
  if (!strongMatch) {
    throw new BcvRateFetchError("No se encontró valor de tasa en BCV");
  }
  const raw = strongMatch[1].trim();
  // Formato venezolano: eliminar puntos (miles, no aplica acá pero por si acaso)
  // y convertir coma a punto para parseFloat.
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return {
    bsPerUsd: normalizeRate(parsed),
    source: "bcv-scrape",
    fetchedAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// API pública
// ═══════════════════════════════════════════════════════════════

/**
 * Intenta obtener la tasa BCV con fallback. Los errores individuales
 * de cada fuente se acumulan en el mensaje final si TODAS fallan.
 */
export async function fetchBcvRate(): Promise<BcvRateResult> {
  const errors: string[] = [];

  try {
    return await fetchFromDolarApi();
  } catch (err) {
    errors.push(
      `dolarapi: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  try {
    return await fetchFromBcvScrape();
  } catch (err) {
    errors.push(
      `bcv-scrape: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  throw new BcvRateFetchError(
    `Todas las fuentes de tasa BCV fallaron. Detalles: ${errors.join(" | ")}`
  );
}
