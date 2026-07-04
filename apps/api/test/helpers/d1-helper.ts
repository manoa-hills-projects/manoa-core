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

    db = drizzle(d1 as any, { schema });
  }

  return { mf: mf!, db: db! };
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
