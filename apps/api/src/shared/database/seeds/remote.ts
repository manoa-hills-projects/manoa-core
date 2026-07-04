#!/usr/bin/env node
/**
 * Seed Remoto para D1
 *
 * Ejecuta los seeds directamente contra D1 remoto usando wrangler.
 *
 * Uso:
 *   npm run db:seed:remote              # Ejecuta todos los seeds en dev
 *   npm run db:seed:remote -- --env prod # Ejecuta en producción
 *   npm run db:seed:remote -- --only rbac # Solo seed de RBAC
 *
 * @module seeds/remote
 */

import { execSync } from "child_process";
import readline from "readline";

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const ENVIRONMENTS = {
  dev: {
    name: "DEV",
    dbName: "manoa-db-master-dev",
    dbEnv: "dev",
  },
  prod: {
    name: "PROD",
    dbName: "manoa-db-master-prod",
    dbEnv: "prod",
  },
};

const AVAILABLE_SEEDS = ["rbac", "admin"] as const;
type SeedName = (typeof AVAILABLE_SEEDS)[number];

// ═══════════════════════════════════════════════════════════════
// PARSING DE ARGUMENTOS
// ═══════════════════════════════════════════════════════════════

interface SeedOptions {
  env: "dev" | "prod";
  only?: SeedName;
  reset?: boolean;
  help?: boolean;
}

function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  const options: SeedOptions = { env: "dev" };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--env" || arg === "-e") {
      const env = args[i + 1] as "dev" | "prod";
      if (!["dev", "prod"].includes(env)) {
        console.error(`❌ Entorno inválido: ${env}`);
        process.exit(1);
      }
      options.env = env;
      i++;
    } else if (arg === "--only" || arg === "-o") {
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
🌱 Drizzle Seed Remote - Manoa Core

Uso:
  npm run db:seed:remote                    Ejecuta todos los seeds en dev
  npm run db:seed:remote -- --env prod      Ejecuta en producción
  npm run db:seed:remote -- --only rbac     Solo seed de RBAC
  npm run db:seed:remote -- --reset         Borra y recrea todo

Opciones:
  --env, -e <dev|prod>    Entorno (default: dev)
  --only, -o <name>       Ejecutar solo un seed específico
  --reset, -r             Borrar datos antes de seed
  --help, -h              Mostrar esta ayuda

Seeds disponibles:
  rbac     Perfiles y permisos del sistema RBAC
  admin    Super administrador con perfil RBAC

Ejemplos:
  npm run db:seed:remote
  npm run db:seed:remote -- --env prod
  npm run db:seed:remote -- --only rbac
  npm run db:seed:remote -- --reset --only admin
  `);
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════

function executeD1Command(dbName: string, dbEnv: string, command: string): string {
  try {
    return execSync(
      `npx wrangler d1 execute ${dbName} --env ${dbEnv} --remote --command "${command.replace(/\n/g, " ").trim()}"`,
      { encoding: "utf8", stdio: "pipe" }
    );
  } catch (error: any) {
    throw new Error(`Error ejecutando SQL: ${error.message}`);
  }
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// SEEDS
// ═══════════════════════════════════════════════════════════════

async function resetDatabase(dbName: string, dbEnv: string): Promise<void> {
  console.log("\n🗑️  Reset: Borrando datos existentes...");

  const tables = ["rbac_audit_logs", "user_profiles", "profile_permissions", "profiles"];

  for (const table of tables) {
    try {
      executeD1Command(dbName, dbEnv, `DELETE FROM ${table}`);
      console.log(`   ✅ Tabla '${table}' limpiada`);
    } catch (error: any) {
      if (error.message.includes("no such table")) {
        console.log(`   ⏭️  Tabla '${table}' no existe`);
      } else {
        throw error;
      }
    }
  }

  console.log("   ✅ Base de datos reseteada");
}

async function seedRbac(dbName: string, dbEnv: string): Promise<void> {
  console.log("\n" + "═".repeat(50));
  console.log("🔐 SEED: RBAC - Perfiles y Permisos");
  console.log("═".repeat(50));

  const now = Date.now();

  // 1. Crear perfil super_admin
  console.log("\n📝 Creando perfil 'super_admin'...");
  const superAdminId = crypto.randomUUID();
  try {
    executeD1Command(
      dbName,
      dbEnv,
      `INSERT INTO profiles (id, key, name, description, is_system, is_default, is_active, created_at, updated_at) VALUES ('${superAdminId}', 'super_admin', 'Super Administrador', 'Acceso total al sistema. Puede gestionar perfiles, permisos y todos los módulos.', 1, 0, 1, ${now}, ${now})`
    );
    console.log("   ✅ Perfil 'super_admin' creado");
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      console.log("   ⏭️  Perfil 'super_admin' ya existe");
    } else {
      throw error;
    }
  }

  // 2. Crear perfil citizen
  console.log("\n📝 Creando perfil 'citizen'...");
  const citizenId = crypto.randomUUID();
  try {
    executeD1Command(
      dbName,
      dbEnv,
      `INSERT INTO profiles (id, key, name, description, is_system, is_default, is_active, created_at, updated_at) VALUES ('${citizenId}', 'citizen', 'Vecino', 'Perfil por defecto para ciudadanos registrados. Acceso limitado a sus datos.', 1, 1, 1, ${now}, ${now})`
    );
    console.log("   ✅ Perfil 'citizen' creado");
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      console.log("   ⏭️  Perfil 'citizen' ya existe");
    } else {
      throw error;
    }
  }

  // 3. Obtener IDs de perfiles
  console.log("\n📝 Obteniendo IDs de perfiles...");
  const superAdminResult = executeD1Command(
    dbName,
    dbEnv,
    `SELECT id FROM profiles WHERE key = 'super_admin'`
  );
  const superAdminMatch = superAdminResult.match(/"id"\s*:\s*"([^"]+)"/);
  const superAdminProfileId = superAdminMatch ? superAdminMatch[1] : superAdminId;

  const citizenResult = executeD1Command(
    dbName,
    dbEnv,
    `SELECT id FROM profiles WHERE key = 'citizen'`
  );
  const citizenMatch = citizenResult.match(/"id"\s*:\s*"([^"]+)"/);
  const citizenProfileId = citizenMatch ? citizenMatch[1] : citizenId;

  console.log(`   ✅ super_admin: ${superAdminProfileId}`);
  console.log(`   ✅ citizen: ${citizenProfileId}`);

  // 4. Crear permisos para super_admin (todos los módulos con view)
  console.log("\n📝 Creando permisos para super_admin...");
  const allModules = [
    "houses", "families", "citizens", "requests", "documents", "signatories",
    "validations", "polls", "events", "treasury", "payments", "tickets",
    "inventory", "laws", "ai", "stats", "reports", "users", "profiles", "settings"
  ];

  const superAdminPermValues = allModules.map(module => {
    const permId = crypto.randomUUID();
    return `('${permId}', '${superAdminProfileId}', '${module}', 'view', 1, ${now}, ${now})`;
  });

  if (superAdminPermValues.length > 0) {
    try {
      executeD1Command(
        dbName,
        dbEnv,
        `INSERT OR IGNORE INTO profile_permissions (id, profile_id, module, action, allowed, created_at, updated_at) VALUES ${superAdminPermValues.join(', ')}`
      );
      console.log(`   ✅ ${allModules.length} módulos habilitados para super_admin`);
    } catch (error: any) {
      console.log(`   ⚠️  Error creando permisos: ${error.message}`);
    }
  }

  // 5. Crear permisos para citizen (módulos de transparencia para zonas 1/2)
  // citizen puede ver transparencia (houses, families, citizens, polls, laws, stats)
  // y sus propios datos (requests) y comunidad (ai)
  console.log("\n📝 Creando permisos para citizen...");
  const citizenModules = [
    "houses", "families", "citizens", "requests", "polls", "laws", "ai", "stats"
  ];

  const citizenPermValues = citizenModules.map(module => {
    const permId = crypto.randomUUID();
    return `('${permId}', '${citizenProfileId}', '${module}', 'view', 1, ${now}, ${now})`;
  });

  if (citizenPermValues.length > 0) {
    try {
      executeD1Command(
        dbName,
        dbEnv,
        `INSERT OR IGNORE INTO profile_permissions (id, profile_id, module, action, allowed, created_at, updated_at) VALUES ${citizenPermValues.join(', ')}`
      );
      console.log(`   ✅ ${citizenModules.length} módulos habilitados para citizen`);
    } catch (error: any) {
      console.log(`   ⚠️  Error creando permisos: ${error.message}`);
    }
  }

  console.log("\n📊 Resumen ACL:");
  console.log(`   Perfiles creados: 2`);
  console.log(`   Módulos super_admin: ${allModules.length}`);
  console.log(`   Módulos citizen: ${citizenModules.length}`);
}

async function seedAdmin(dbName: string, dbEnv: string): Promise<void> {
  console.log("\n" + "═".repeat(50));
  console.log("👤 SEED: Super Admin");
  console.log("═".repeat(50));

  const email = process.env.ADMIN_EMAIL || "admin@manoa.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Administrador";

  console.log(`\n📝 Creando super admin...`);
  console.log(`   Email: ${email}`);
  console.log(`   Nombre: ${name}`);

  // Nota: Este seed solo crea el usuario y asigna el perfil RBAC
  // La contraseña debe configurarse manualmente o usar admin:create
  let now = Date.now();
  let userId = crypto.randomUUID();

  try {
    executeD1Command(
      dbName,
      dbEnv,
      `INSERT INTO user (id, email, name, role, email_verified, banned, created_at, updated_at) VALUES ('${userId}', '${email}', '${name}', 'superadmin', 1, 0, ${now}, ${now})`
    );
    console.log("   ✅ Usuario creado");
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      console.log("   ⏭️  El usuario ya existe, usando el existente");
      // Obtener ID del usuario existente
      const result = executeD1Command(dbName, dbEnv, `SELECT id FROM user WHERE email = '${email}'`);
      const match = result.match(/"id"\s*:\s*"([^"]+)"/);
      if (match) {
        userId = match[1]; // Usar el ID existente
        console.log(`   ✅ User ID: ${userId}`);
      }
      // Actualizar role a superadmin
      executeD1Command(dbName, dbEnv, `UPDATE user SET role = 'superadmin', updated_at = ${now} WHERE id = '${userId}'`);
      console.log("   ✅ Role actualizado a superadmin");
    } else {
      throw error;
    }
  }

  // Asignar perfil super_admin
  console.log("\n📝 Asignando perfil RBAC...");
  const profileResult = executeD1Command(
    dbName,
    dbEnv,
    `SELECT id FROM profiles WHERE key = 'super_admin'`
  );
  const profileMatch = profileResult.match(/"id"\s*:\s*"([^"]+)"/);

  if (profileMatch) {
    const profileId = profileMatch[1];
    const userProfileId = crypto.randomUUID();

    try {
      executeD1Command(
        dbName,
        dbEnv,
        `INSERT INTO user_profiles (id, user_id, profile_id, created_at, updated_at) VALUES ('${userProfileId}', '${userId}', '${profileId}', ${now}, ${now})`
      );
      console.log("   ✅ Perfil 'super_admin' asignado");
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        console.log("   ⏭️  El usuario ya tiene perfil asignado");
      } else {
        throw error;
      }
    }
  } else {
    console.log("   ⚠️  Perfil 'super_admin' no encontrado");
    console.log("   💡 Ejecuta primero: npm run db:seed:remote -- --only rbac");
  }

  console.log("\n📊 Resumen Admin:");
  console.log(`   User ID: ${userId}`);
  console.log(`   Email: ${email}`);
  console.log(`   ⚠️  Configura la contraseña manualmente con: npm run admin:create`);
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  const env = ENVIRONMENTS[options.env];

  console.log("\n" + "🌱".repeat(20));
  console.log("  DRIZZLE SEED REMOTE - MANOA CORE");
  console.log("🌱".repeat(20));
  console.log(`\n🌍 Entorno: ${env.name}`);
  console.log(`📁 Base de datos: ${env.dbName}`);

  // Confirmación para producción
  if (options.env === "prod") {
    const confirm = await ask("\n⚠️  ¿Estás seguro de ejecutar seeds en PRODUCCIÓN? (yes/no): ");
    if (confirm.toLowerCase() !== "yes") {
      console.log("❌ Operación cancelada");
      return;
    }
  }

  try {
    // Reset si se solicitó
    if (options.reset) {
      await resetDatabase(env.dbName, env.dbEnv);
    }

    // Ejecutar seeds
    if (options.only === "rbac") {
      await seedRbac(env.dbName, env.dbEnv);
    } else if (options.only === "admin") {
      await seedAdmin(env.dbName, env.dbEnv);
    } else {
      // Ejecutar todos los seeds
      await seedRbac(env.dbName, env.dbEnv);
      await seedAdmin(env.dbName, env.dbEnv);
    }

    console.log("\n" + "═".repeat(50));
    console.log("✅ SEED REMOTO COMPLETADO EXITOSAMENTE");
    console.log("═".repeat(50));
    console.log("\n🎉 ¡Base de datos remota lista para usar!");

  } catch (error: any) {
    console.error("\n❌ Error ejecutando seed remoto:", error.message);
    process.exit(1);
  }
}

// Ejecutar
main().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});
