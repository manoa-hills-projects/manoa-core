#!/usr/bin/env node
/**
 * Actualizar contraseña de usuario existente
 *
 * Uso:
 *   npm run admin:update-password
 */

import { execSync } from "child_process";
import { hashPassword } from "@better-auth/utils/password";
import readline from "readline";

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
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function updatePassword() {
  console.log("\n🔑 Actualizar Contraseña de Usuario\n");

  // 1. Seleccionar entorno
  let envKey = await ask("¿En qué entorno? (1 = Dev, 2 = Prod) [1]: ");
  envKey = envKey.trim() || "1";
  const envKeyName = envKey === "2" ? "prod" : "dev";
  const env = ENVIRONMENTS[envKeyName];
  console.log(`   Usando: ${env.name}\n`);

  // 2. Pedir email del usuario
  const email = await ask("Email del usuario: ");
  if (!email.includes("@")) {
    console.error("❌ Email inválido");
    process.exit(1);
  }

  // 3. Pedir nueva contraseña
  const password = await ask("Nueva contraseña: ");
  if (password.length < 8) {
    console.error("❌ Mínimo 8 caracteres");
    process.exit(1);
  }

  const confirmPassword = await ask("Confirmar contraseña: ");
  if (password !== confirmPassword) {
    console.error("❌ Las contraseñas no coinciden");
    process.exit(1);
  }

  // 4. Hashear contraseña
  const hashedPassword = await hashPassword(password);
  const now = Date.now();

  // 5. Buscar usuario
  console.log(`\n⏳ Buscando usuario ${email}...`);
  const userResult = execSync(
    `npx wrangler d1 execute ${env.dbName} --env ${env.dbEnv} --remote --command "SELECT id FROM user WHERE email = '${email.trim().toLowerCase()}'"`,
    { encoding: "utf8", stdio: "pipe" }
  );

  const match = userResult.match(/"id"\s*:\s*"([^"]+)"/);
  if (!match) {
    console.error(`❌ Usuario ${email} no encontrado`);
    process.exit(1);
  }

  const userId = match[1];
  console.log(`   ✅ Usuario encontrado: ${userId}`);

  // 6. Actualizar contraseña en account
  console.log(`\n⏳ Actualizando contraseña...`);
  const updateSQL = `
    UPDATE account
    SET password = '${hashedPassword}', updated_at = ${now}
    WHERE user_id = '${userId}' AND provider_id = 'credential'
  `;

  try {
    execSync(
      `npx wrangler d1 execute ${env.dbName} --env ${env.dbEnv} --remote --command "${updateSQL.replace(/\n/g, " ").trim()}"`,
      { encoding: "utf8", stdio: "pipe" }
    );
    console.log("   ✅ Contraseña actualizada!");

    console.log("\n" + "=".repeat(40));
    console.log("🎉 ¡Contraseña actualizada exitosamente!");
    console.log(`   Email: ${email.trim().toLowerCase()}`);
    console.log("=".repeat(40));
    console.log("\nYa puedes hacer login con la nueva contraseña.");
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

updatePassword().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
