#!/usr/bin/env node
/**
 * Script interactivo para crear un Super Admin en DEV o PROD.
 *
 * Uso:
 *   npm run admin:create              # Pregunta el entorno
 *   npm run admin:create -- --env dev # Dev
 *   npm run admin:create -- --env prod
 * 
 * Este script:
 * 1. Crea el usuario con role: 'superadmin' (legacy)
 * 2. Asigna el perfil 'super_admin' del sistema RBAC
 * 
 * @note
 * Better Auth usa scrypt (no bcrypt) para hashing de contraseñas.
 * El formato del hash es: <salt_hex>:<key_hex>
 * Usamos @better-auth/utils/password para generar el hash correcto.
 */

import readline from "readline";
import { execSync } from "child_process";
import { hashPassword } from "@better-auth/utils/password";

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

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

function executeD1Command(dbName, dbEnv, command) {
  return execSync(
    `npx wrangler d1 execute ${dbName} --env ${dbEnv} --remote --command "${command.replace(/\n/g, " ").trim()}"`,
    { encoding: "utf8", stdio: "pipe" }
  );
}

async function createAdmin() {
  console.log("\n🛠️  Crear Super Admin - Manoa API\n");
  console.log("=".repeat(40) + "\n");

  // 1. Seleccionar entorno
  let envKey = await ask("¿En qué entorno? (1 = Dev, 2 = Prod) [1]: ");
  envKey = envKey.trim() || "1";
  const envKeyName = envKey === "2" ? "prod" : "dev";
  const env = ENVIRONMENTS[envKeyName];
  console.log(`   Usando: ${env.name}\n`);

  // 2. Pedir datos del admin
  const name = await ask("Nombre completo: ");
  if (!name.trim()) { console.error("❌ El nombre es requerido"); process.exit(1); }

  const email = await ask("Email: ");
  if (!email.includes("@")) { console.error("❌ Email inválido"); process.exit(1); }

  const password = await ask("Contraseña: ");
  if (password.length < 8) { console.error("❌ Mínimo 8 caracteres"); process.exit(1); }

  const confirmPassword = await ask("Confirmar contraseña: ");
  if (password !== confirmPassword) { console.error("❌ Las contraseñas no coinciden"); process.exit(1); }

  // 3. Generar datos
  const id = crypto.randomUUID();
  const emailLower = email.trim().toLowerCase();
  const nameTrimmed = name.trim();
  const hashedPassword = await hashPassword(password);
  const now = Date.now();

  // 4. Insertar usuario directamente en D1 (sin API)
  console.log(`\n⏳ Creando usuario en ${env.name}...`);

  const insertSQL = `
    INSERT INTO user (id, email, name, role, email_verified, banned, created_at, updated_at)
    VALUES (
      '${id}',
      '${emailLower}',
      '${nameTrimmed.replace(/'/g, "''")}',
      'superadmin',
      1,
      0,
      ${now},
      ${now}
    )
  `;

  // Crear también el hash en la tabla account para better-auth
  const accountId = crypto.randomUUID();
  const accountInsertSQL = `
    INSERT INTO account (
      id, account_id, provider_id, user_id, password, created_at, updated_at
    ) VALUES (
      '${accountId}',
      '${emailLower}',
      'credential',
      '${id}',
      '${hashedPassword}',
      ${now},
      ${now}
    )
  `;

  try {
    // Ejecutar en D1 remoto
    executeD1Command(env.dbName, env.dbEnv, insertSQL);
    console.log("   ✅ Usuario creado!");

    // Insertar account con password hash
    executeD1Command(env.dbName, env.dbEnv, accountInsertSQL);
    console.log("   ✅ Contraseña configurada!");

    // 5. Verificar y crear perfiles RBAC si no existen
    console.log("\n⏳ Verificando perfiles RBAC...");
    
    // Crear perfil super_admin si no existe
    const checkProfileSQL = `SELECT id FROM profiles WHERE key = 'super_admin' LIMIT 1`;
    let profileId = null;
    
    try {
      const profileResult = executeD1Command(env.dbName, env.dbEnv, checkProfileSQL);
      const match = profileResult.match(/"id"\s*:\s*"([^"]+)"/);
      if (match) {
        profileId = match[1];
        console.log("   ✅ Perfil 'super_admin' encontrado:", profileId);
      }
    } catch (error) {
      // La tabla puede no existir, intentar crearla
      if (error.message.includes("no such table")) {
        console.log("   ⚠️  Tabla 'profiles' no existe");
        console.log("   💡 Ejecuta primero: npm run deploy:dev && npm run db:push:dev");
      } else {
        console.log("   ❌ Error buscando perfil:", error.message);
      }
    }

    // Intentar crear perfil si no existe
    if (!profileId) {
      console.log("\n⏳ Creando perfil RBAC...");
      
      const superAdminProfileId = crypto.randomUUID();
      const createProfileSQL = `
        INSERT INTO profiles (id, key, name, description, is_system, is_default, is_active, created_at, updated_at)
        VALUES (
          '${superAdminProfileId}',
          'super_admin',
          'Super Administrador',
          'Acceso total al sistema',
          1,
          0,
          1,
          ${now},
          ${now}
        )
      `;
      
      try {
        executeD1Command(env.dbName, env.dbEnv, createProfileSQL);
        profileId = superAdminProfileId;
        console.log("   ✅ Perfil 'super_admin' creado");
      } catch (err) {
        console.log("   ❌ No se pudo crear el perfil:", err.message);
      }
    }

    // 6. Asignar perfil super_admin al usuario
    if (profileId) {
      console.log("\n⏳ Asignando perfil RBAC...");
      
      const userProfileId = crypto.randomUUID();
      const assignProfileSQL = `
        INSERT INTO user_profiles (id, user_id, profile_id, created_at, updated_at)
        VALUES (
          '${userProfileId}',
          '${id}',
          '${profileId}',
          ${now},
          ${now}
        )
      `;
      
      try {
        executeD1Command(env.dbName, env.dbEnv, assignProfileSQL);
        console.log("   ✅ Perfil 'super_admin' asignado!");
      } catch (error) {
        if (error.message.includes("UNIQUE constraint failed")) {
          console.log("   ⚠️  El usuario ya tiene un perfil asignado");
        } else {
          console.log("   ⚠️  No se pudo asignar el perfil:", error.message);
        }
      }
    } else {
      console.log("\n   ⚠️  Usuario creado SIN perfil RBAC");
      console.log("   💡 Asigna el perfil manualmente o ejecuta: npm run db:seed:rbac");
    }

    console.log("\n" + "=".repeat(40));
    console.log("🎉 ¡Superadmin creado exitosamente!");
    console.log(`   Nombre: ${nameTrimmed}`);
    console.log(`   Email: ${emailLower}`);
    console.log(`   Rol: superadmin (legacy)`);
    if (profileId) {
      console.log(`   Perfil: super_admin (RBAC)`);
    }
    console.log("=".repeat(40));
    console.log("\nYa puedes hacer login con estas credenciales.");

  } catch (error) {
    // Verificar si el usuario ya existe
    if (error.message.includes("UNIQUE constraint failed")) {
      console.error(`\n❌ El email ${emailLower} ya está registrado.`);
    } else {
      console.error(`\n❌ Error: ${error.message}`);
    }
    process.exit(1);
  }
}

createAdmin().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});