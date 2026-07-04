/**
 * Utilidades para manejo de dinero.
 *
 * Los montos SIEMPRE se guardan en la DB como enteros (centavos) para evitar
 * drift de floats en SQLite. Las conversiones a/desde string decimal viven
 * solo en los bordes del sistema (DTOs y UI).
 *
 * Bs y USD comparten el mismo formato: 2 decimales, centavos como parte entera.
 *
 * @module utils/money
 */

const CENTS_PER_UNIT = 100;

/**
 * Convierte un string decimal (ej "123.45") a centavos (12345).
 * Acepta punto o coma como separador decimal, ignora espacios.
 * Lanza Error si el input no es válido.
 */
export function toCents(value: string | number): number {
  const str = typeof value === "number" ? value.toString() : value;
  const normalized = str.trim().replace(/\s/g, "").replace(",", ".");
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(normalized);
  if (!match) throw new Error(`Monto no válido: "${value}"`);
  const [, sign, intPart, fracPartRaw = ""] = match;
  const fracPart = (fracPartRaw + "00").slice(0, 2);
  const carry = fracPartRaw.length > 2 && Number(fracPartRaw[2]) >= 5 ? 1 : 0;
  const cents = Number.parseInt(intPart, 10) * CENTS_PER_UNIT +
    Number.parseInt(fracPart, 10) + carry;
  return sign === "-" ? -cents : cents;
}

/**
 * Convierte centavos a string decimal con 2 decimales fijos.
 */
export function fromCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const units = Math.trunc(abs / CENTS_PER_UNIT);
  const remainder = abs % CENTS_PER_UNIT;
  return `${sign}${units}.${remainder.toString().padStart(2, "0")}`;
}

/**
 * Formatea centavos como "Bs 1.234,56" (formato venezolano con miles y coma).
 */
export function formatBs(cents: number): string {
  return `Bs ${formatVenezuelan(cents)}`;
}

/**
 * Formatea centavos como "$1,234.56" (formato USD).
 */
export function formatUsd(cents: number): string {
  return `$${formatUS(cents)}`;
}

function formatVenezuelan(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const units = Math.trunc(abs / CENTS_PER_UNIT);
  const remainder = abs % CENTS_PER_UNIT;
  const unitsStr = units
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${unitsStr},${remainder.toString().padStart(2, "0")}`;
}

function formatUS(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const units = Math.trunc(abs / CENTS_PER_UNIT);
  const remainder = abs % CENTS_PER_UNIT;
  const unitsStr = units
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${unitsStr}.${remainder.toString().padStart(2, "0")}`;
}
