/**
 * Formateo de montos monetarios en el frontend.
 * Refleja `apps/api/src/shared/utils/money.util.ts` — enteros de centavos.
 */

const CENTS_PER_UNIT = 100;

export function formatBs(cents: number | null | undefined): string {
	if (cents == null) return "—";
	return `Bs ${formatVenezuelan(cents)}`;
}

export function formatUsd(cents: number | null | undefined): string {
	if (cents == null) return "—";
	return `$${formatUS(cents)}`;
}

export function centsToDecimalString(
	cents: number | null | undefined,
): string {
	if (cents == null) return "";
	const sign = cents < 0 ? "-" : "";
	const abs = Math.abs(cents);
	const units = Math.trunc(abs / CENTS_PER_UNIT);
	const remainder = abs % CENTS_PER_UNIT;
	return `${sign}${units}.${remainder.toString().padStart(2, "0")}`;
}

function formatVenezuelan(cents: number): string {
	const sign = cents < 0 ? "-" : "";
	const abs = Math.abs(cents);
	const units = Math.trunc(abs / CENTS_PER_UNIT);
	const remainder = abs % CENTS_PER_UNIT;
	const unitsStr = units.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
	return `${sign}${unitsStr},${remainder.toString().padStart(2, "0")}`;
}

function formatUS(cents: number): string {
	const sign = cents < 0 ? "-" : "";
	const abs = Math.abs(cents);
	const units = Math.trunc(abs / CENTS_PER_UNIT);
	const remainder = abs % CENTS_PER_UNIT;
	const unitsStr = units.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return `${sign}${unitsStr}.${remainder.toString().padStart(2, "0")}`;
}

export const PAYMENT_STATUS_LABELS: Record<
	"pending" | "approved" | "rejected",
	string
> = {
	pending: "Pendiente",
	approved: "Aprobado",
	rejected: "Rechazado",
};

/**
 * Convierte USD (centavos) → Bs (centavos) usando una tasa dada.
 * `bsPerUsd` viene como string decimal (ver schema `treasury_rates`).
 * Devuelve null si falta la tasa o el input.
 */
export function bsCentsFromUsd(
	usdCents: number | null | undefined,
	bsPerUsd: string | null | undefined,
): number | null {
	if (usdCents == null || bsPerUsd == null) return null;
	const rate = Number.parseFloat(bsPerUsd.replace(",", "."));
	if (!Number.isFinite(rate) || rate <= 0) return null;
	return Math.round(usdCents * rate);
}

