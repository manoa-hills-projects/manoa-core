#!/usr/bin/env node
/**
 * Crear admin usando la API de Better Auth
 *
 * Esto asegura que el hash de contraseña se genere correctamente
 * usando la misma configuración que Better Auth.
 *
 * Uso:
 *   npm run admin:create-api
 */

const API_BASE_URL = process.env.API_BASE_URL || "https://manoa-api-dev.manoa-it.workers.dev";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@manoa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_NAME = process.env.ADMIN_NAME || "Super Administrador";

async function createAdmin() {
  console.log("\n👤 Creando Admin via Better Auth API\n");
  console.log(`   API: ${API_BASE_URL}`);
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Nombre: ${ADMIN_NAME}\n`);

  try {
    // Intentar crear el usuario via API
    const response = await fetch(`${API_BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: new URL(API_BASE_URL).origin,
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Usuario creado exitosamente!");
      console.log(`   ID: ${data.id || data.user?.id}`);
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log("\n🎉 Ya puedes hacer login con estas credenciales.");
    } else {
      // Si el usuario ya existe, mostrar mensaje
      if (data.message?.includes("already exists") || data.code === "USER_ALREADY_EXISTS") {
        console.log("⚠️  El usuario ya existe.");
        console.log("\n💡 Para actualizar la contraseña, usa:");
        console.log("   npm run admin:update-password");
      } else {
        console.error("❌ Error creando usuario:");
        console.error(`   ${JSON.stringify(data, null, 2)}`);
      }
    }
  } catch (error) {
    console.error("❌ Error de conexión:");
    console.error(`   ${error.message}`);
    console.log("\n💡 Asegúrate de que la API esté deployada:");
    console.log("   npm run deploy:dev");
  }
}

createAdmin();
