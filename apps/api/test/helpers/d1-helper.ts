/**
 * Helper para tests con D1
 *
 * Proporciona una instancia compartida de Miniflare y D1
 * para evitar crear una nueva instancia en cada test.
 */

import { Miniflare } from "miniflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../src/shared/database/schemas";

let mf: Miniflare | null = null;
let db: ReturnType<typeof drizzle> | null = null;

/**
 * SQL para crear las tablas necesarias para tests RBAC
 */
export const RBAC_MIGRATIONS = [
  // Tabla user (de better-auth)
  `CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified INTEGER DEFAULT 0 NOT NULL,
    image TEXT,
    role TEXT,
    banned INTEGER,
    ban_reason TEXT,
    ban_expires INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  // Tabla profiles
  `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_system INTEGER DEFAULT false NOT NULL,
    is_default INTEGER DEFAULT false NOT NULL,
    is_active INTEGER DEFAULT true NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  )`,
  // Tabla profile_permissions
  `CREATE TABLE IF NOT EXISTS profile_permissions (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    allowed INTEGER DEFAULT true NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  )`,
  // Tabla user_profiles
  `CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES user(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  )`,
  // Tabla audit_logs
  `CREATE TABLE IF NOT EXISTS rbac_audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    changes TEXT,
    created_at INTEGER NOT NULL
  )`,
];

/**
 * SQL para tablas del módulo treasury en tests.
 */
export const TREASURY_MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS treasury_categories (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    kind TEXT DEFAULT 'both' NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS treasury_concepts (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id TEXT NOT NULL REFERENCES treasury_categories(id) ON DELETE RESTRICT,
    default_bs_cents INTEGER,
    default_usd_cents INTEGER,
    valid_from INTEGER NOT NULL,
    valid_until INTEGER,
    is_active INTEGER DEFAULT 1 NOT NULL,
    created_by TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS treasury_rates (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    bs_per_usd TEXT NOT NULL,
    created_by TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS treasury_payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT,
    concept_id TEXT REFERENCES treasury_concepts(id) ON DELETE SET NULL,
    description TEXT,
    amount_bs_cents INTEGER NOT NULL,
    amount_usd_cents INTEGER NOT NULL,
    rate_id TEXT NOT NULL REFERENCES treasury_rates(id) ON DELETE RESTRICT,
    receipt_r2_key TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    review_notes TEXT,
    reviewed_by TEXT REFERENCES user(id) ON DELETE SET NULL,
    reviewed_at INTEGER,
    submitted_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS treasury_expenses (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES treasury_categories(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    beneficiary TEXT,
    amount_bs_cents INTEGER NOT NULL,
    amount_usd_cents INTEGER NOT NULL,
    rate_id TEXT NOT NULL REFERENCES treasury_rates(id) ON DELETE RESTRICT,
    receipt_r2_key TEXT,
    spent_at INTEGER NOT NULL,
    registered_by TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  )`,
];

/**
 * Obtiene o crea la instancia de Miniflare y D1
 */
export async function getTestDB() {
  if (!mf) {
    mf = new Miniflare({
      modules: true,
      script: `export default { fetch() { return new Response("ok"); } }`,
      d1Databases: ["DB"],
    });
  }

  if (!db) {
    const d1 = await mf.getD1Database("DB");

    // Ejecutar migraciones
    for (const sql of RBAC_MIGRATIONS) {
      await d1.prepare(sql).run();
    }
    for (const sql of TREASURY_MIGRATIONS) {
      await d1.prepare(sql).run();
    }

    db = drizzle(d1 as any, { schema });
  }

  return { mf: mf!, db: db! };
}

/**
 * Limpia las tablas del módulo treasury (orden inverso de FKs).
 */
export async function clearTreasuryTables() {
  if (!mf) return;
  const d1 = await mf.getD1Database("DB");
  await d1.prepare("DELETE FROM treasury_expenses").run();
  await d1.prepare("DELETE FROM treasury_payments").run();
  await d1.prepare("DELETE FROM treasury_rates").run();
  await d1.prepare("DELETE FROM treasury_concepts").run();
  await d1.prepare("DELETE FROM treasury_categories").run();
}

/**
 * Limpia las tablas RBAC
 */
export async function clearRBACTables() {
  if (!mf) return;

  const d1 = await mf.getD1Database("DB");
  await d1.prepare("DELETE FROM rbac_audit_logs").run();
  await d1.prepare("DELETE FROM user_profiles").run();
  await d1.prepare("DELETE FROM profile_permissions").run();
  await d1.prepare("DELETE FROM profiles").run();
}

/**
 * Limpia la tabla de usuarios
 */
export async function clearUsersTable() {
  if (!mf) return;

  const d1 = await mf.getD1Database("DB");
  await d1.prepare("DELETE FROM user").run();
}

/**
 * Cierra la instancia de Miniflare
 */
export async function disposeTestDB() {
  if (mf) {
    await mf.dispose();
    mf = null;
    db = null;
  }
}
