import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, and } from "drizzle-orm";
import * as schema from "../src/shared/database/schemas/index";
import drizzleConfig from "../drizzle.config";
import { SYSTEM_PROFILES } from "../src/shared/constants/profiles";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8787";
const BOOTSTRAP_ADMIN_KEY = process.env.BOOTSTRAP_ADMIN_KEY;

// Variables específicas del seed (pueden coincidir con las de bootstrap para compatibilidad)
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? process.env.ADMIN_NAME ?? "Administrador";
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL;
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
const ORIGIN = process.env.SEED_ORIGIN ?? process.env.BOOTSTRAP_ORIGIN ?? new URL(API_BASE_URL).origin;

if (!BOOTSTRAP_ADMIN_KEY) {
	console.error("Falta BOOTSTRAP_ADMIN_KEY en variables de entorno");
	process.exit(1);
}

if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
	console.error("Faltan SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD o ADMIN_EMAIL/ADMIN_PASSWORD");
	process.exit(1);
}

const seedAdminEmail = SEED_ADMIN_EMAIL;
const seedAdminPassword = SEED_ADMIN_PASSWORD;

const run = async () => {
	// 1. Crear usuario vía API
	const response = await fetch(`${API_BASE_URL}/api/auth/sign-up/email`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Origin: ORIGIN,
			"X-Bootstrap-Key": BOOTSTRAP_ADMIN_KEY,
		},
		body: JSON.stringify({
			name: SEED_ADMIN_NAME,
			email: seedAdminEmail,
			password: seedAdminPassword,
		}),
	});

	const bodyText = await response.text();

	if (!response.ok) {
		console.error(`Error ${response.status}: ${bodyText}`);
		process.exit(1);
	}

	console.log("Usuario creado vía API:", bodyText);

	try {
		const dbPath = (drizzleConfig as { dbCredentials?: { url?: string } }).dbCredentials?.url;

		if (!dbPath) {
			console.warn(
				"Seed: no se pudo resolver la ruta de la base de datos; el usuario se creó pero no se asignó el rol/perfil.",
			);
			return;
		}

		const sqlite = new Database(dbPath);
		const db = drizzle(sqlite, { schema });

		// 2. Actualizar role legacy a superadmin
		await db
			.update(schema.user)
			.set({ role: "superadmin" })
			.where(eq(schema.user.email, seedAdminEmail));

		console.log("✓ Rol 'superadmin' asignado al usuario (legacy).");

		// 3. Obtener el usuario creado
		const user = await db
			.select()
			.from(schema.user)
			.where(eq(schema.user.email, seedAdminEmail))
			.get();

		if (!user) {
			console.error("No se pudo encontrar el usuario creado");
			sqlite.close();
			return;
		}

		// 4. Buscar el perfil super_admin
		const superAdminProfile = await db
			.select()
			.from(schema.profiles)
			.where(eq(schema.profiles.key, SYSTEM_PROFILES.SUPER_ADMIN))
			.get();

		if (!superAdminProfile) {
			console.warn(
				"⚠ Perfil 'super_admin' no encontrado. Ejecuta primero: POST /api/seed/seed-rbac"
			);
			sqlite.close();
			return;
		}

		// 5. Verificar si ya tiene perfil asignado
		const existingProfile = await db
			.select()
			.from(schema.userProfiles)
			.where(eq(schema.userProfiles.userId, user.id))
			.get();

		if (existingProfile) {
			console.log("✓ El usuario ya tiene un perfil RBAC asignado.");
		} else {
			// 6. Asignar perfil super_admin
			await db.insert(schema.userProfiles).values({
				userId: user.id,
				profileId: superAdminProfile.id,
			});
			console.log("✓ Perfil 'super_admin' asignado al usuario (RBAC).");
		}

		sqlite.close();
	} catch (error) {
		console.error("Error actualizando rol/perfil:", error);
	}

	console.log("\n✅ Usuario super admin inicial creado correctamente.");
	console.log(`   Email: ${seedAdminEmail}`);
	console.log(`   Role: superadmin (legacy)`);
	console.log(`   Profile: super_admin (RBAC)`);
};

run().catch((error) => {
	console.error("Error ejecutando el seed de super admin:", error);
	process.exit(1);
});
