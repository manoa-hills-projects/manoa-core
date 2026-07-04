/**
 * Orquestador de Seeds
 *
 * Ejecuta los seeds de la base de datos de forma modular.
 *
 * Uso:
 *   npm run db:seed                    # Ejecuta todos los seeds
 *   npm run db:seed -- --only rbac     # Solo seed de RBAC
 *   npm run db:seed -- --only admin    # Solo seed de admin
 *   npm run db:seed -- --reset         # Borra y recrea todo
 *
 * @module seeds/index
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../schemas";
import drizzleConfig from "../../../../drizzle.config.js";
import { seedRbac } from "./rbac.seed";
import { seedAdmin } from "./admin.seed";

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

/**
 * Seeds disponibles
 */
const AVAILABLE_SEEDS = ["rbac", "admin"] as const;
type SeedName = (typeof AVAILABLE_SEEDS)[number];

/**
 * Configuración del seed de admin (puede venir de variables de entorno)
 */
const ADMIN_CONFIG = {
  email: process.env.ADMIN_EMAIL || "admin@manoa.com",
  password: process.env.ADMIN_PASSWORD || "admin123",
  name: process.env.ADMIN_NAME || "Administrador",
};

// ═══════════════════════════════════════════════════════════════
// PARSING DE ARGUMENTOS
// ═══════════════════════════════════════════════════════════════

interface SeedOptions {
  only?: SeedName;
  reset?: boolean;
  help?: boolean;
}

function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  const options: SeedOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--only" || arg === "-o") {
      const seedName = args[i + 1] as SeedName;
      if (!AVAILABLE_SEEDS.includes(seedName)) {
        console.error(`❌ Seed inválido: ${seedName}`);
        console.log(`   Seeds disponibles: ${AVAILABLE_SEEDS.join(", ")}`);
        process.exit(1);
      }
      options.only = seedName;
      i++;
    } else if (arg === "--reset" || arg === "-r") {
      options.reset = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
🌱 Drizzle Seed - Manoa Core

Uso:
  npm run db:seed                    Ejecuta todos los seeds
  npm run db:seed -- --only rbac     Solo seed de RBAC
  npm run db:seed -- --only admin    Solo seed de admin
  npm run db:seed -- --reset         Borra y recrea todo

Opciones:
  --only, -o <name>    Ejecutar solo un seed específico
  --reset, -r          Borrar datos antes de seed
  --help, -h           Mostrar esta ayuda

Seeds disponibles:
  rbac     Perfiles y permisos del sistema RBAC
  admin    Super administrador con perfil RBAC

Ejemplos:
  npm run db:seed
  npm run db:seed -- --only rbac
  npm run db:seed -- --reset --only admin
  `);
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES PRINCIPALES
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene la ruta de la base de datos desde drizzle.config
 */
function getDbPath(): string {
  const dbPath = (drizzleConfig as { dbCredentials?: { url?: string } }).dbCredentials?.url;
  
  if (!dbPath) {
    console.error("❌ No se pudo resolver la ruta de la base de datos");
    console.error("   Verifica drizzle.config.ts");
    process.exit(1);
  }

  return dbPath;
}

/**
 * Borra las tablas relacionadas con los seeds
 */
async function resetDatabase(db: ReturnType<typeof drizzle>): Promise<void> {
  console.log("\n🗑️  Reset: Borrando datos existentes...");

  // Orden importa por las foreign keys
  const tables = [
    schema.auditLogs,
    schema.userProfiles,
    schema.profilePermissions,
    schema.profiles,
  ];

  for (const table of tables) {
    await db.delete(table).run();
    console.log(`   ✅ Tabla '${table[Symbol.for("drizzle:Name") as any] || "unknown"}' limpiada`);
  }

  console.log("   ✅ Base de datos reseteada");
}

/**
 * Ejecuta el seed de RBAC
 */
async function runRbacSeed(db: ReturnType<typeof drizzle>): Promise<void> {
  console.log("\n" + "═".repeat(50));
  console.log("🔐 SEED: RBAC - Perfiles y Permisos");
  console.log("═".repeat(50));

  const result = await seedRbac(db as any);

  console.log("\n📊 Resumen:");
  console.log(`   Perfiles creados: ${result.profilesCreated}`);
  console.log(`   Perfiles existentes: ${result.profilesSkipped}`);
}

/**
 * Ejecuta el seed de Admin
 */
async function runAdminSeed(db: ReturnType<typeof drizzle>): Promise<void> {
  console.log("\n" + "═".repeat(50));
  console.log("👤 SEED: Super Admin");
  console.log("═".repeat(50));

  const result = await seedAdmin(db as any, ADMIN_CONFIG);

  console.log("\n📊 Resumen:");
  console.log(`   User ID: ${result.userId}`);
  console.log(`   Email: ${result.email}`);
  console.log(`   Nombre: ${result.name}`);
  console.log(`   Perfil RBAC: ${result.profileAssigned ? "✅ Asignado" : "❌ No asignado"}`);
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const options = parseArgs();

  // Mostrar ayuda
  if (options.help) {
    showHelp();
    return;
  }

  console.log("\n" + "🌱".repeat(20));
  console.log("  DRIZZLE SEED - MANOA CORE");
  console.log("🌱".repeat(20));

  // Obtener ruta de BD
  const dbPath = getDbPath();
  console.log(`\n📁 Base de datos: ${dbPath}`);

  // Conectar a la base de datos
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });

  try {
    // Reset si se solicitó
    if (options.reset) {
      await resetDatabase(db);
    }

    // Ejecutar seeds
    if (options.only === "rbac") {
      await runRbacSeed(db);
    } else if (options.only === "admin") {
      await runAdminSeed(db);
    } else {
      // Ejecutar todos los seeds
      await runRbacSeed(db);
      await runAdminSeed(db);
    }

    console.log("\n" + "═".repeat(50));
    console.log("✅ SEED COMPLETADO EXITOSAMENTE");
    console.log("═".repeat(50));
    console.log("\n🎉 ¡Base de datos lista para usar!");
    console.log("\n📝 Próximos pasos:");
    console.log("   1. Deployar API: npm run deploy:dev");
    console.log("   2. Login con las credenciales del admin");
    console.log("   3. Verificar perfiles en /profiles");

  } catch (error) {
    console.error("\n❌ Error ejecutando seed:", error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

// Ejecutar
main().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});
