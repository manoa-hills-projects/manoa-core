import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const loadLocalEnvFromFiles = () => {
	const cwd = process.cwd();
	const candidates = [".dev.vars", ".env", ".env.local"];

	for (const fileName of candidates) {
		const filePath = join(cwd, fileName);

		if (!existsSync(filePath)) {
			continue;
		}

		const content = readFileSync(filePath, "utf-8");
		const lines = content.split(/\r?\n/);

		for (const line of lines) {
			const trimmed = line.trim();

			if (!trimmed || trimmed.startsWith("#")) {
				continue;
			}

			const separatorIndex = trimmed.indexOf("=");

			if (separatorIndex === -1) {
				continue;
			}

			const key = trimmed.slice(0, separatorIndex).trim();
			const rawValue = trimmed.slice(separatorIndex + 1).trim();
			const value = rawValue.replace(/^['"]|['"]$/g, "");

			if (!process.env[key]) {
				process.env[key] = value;
			}
		}
	}
};

loadLocalEnvFromFiles();

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8787";
const BOOTSTRAP_ADMIN_KEY = process.env.BOOTSTRAP_ADMIN_KEY;
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Administrador";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ORIGIN = process.env.BOOTSTRAP_ORIGIN ?? new URL(API_BASE_URL).origin;

if (!BOOTSTRAP_ADMIN_KEY) {
	console.error("Falta BOOTSTRAP_ADMIN_KEY (revisa .dev.vars)");
	process.exit(1);
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
	console.error("Faltan ADMIN_EMAIL o ADMIN_PASSWORD");
	process.exit(1);
}

const response = await fetch(`${API_BASE_URL}/api/auth/sign-up/email`, {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Origin: ORIGIN,
		"X-Bootstrap-Key": BOOTSTRAP_ADMIN_KEY,
	},
	body: JSON.stringify({
		name: ADMIN_NAME,
		email: ADMIN_EMAIL,
		password: ADMIN_PASSWORD,
	}),
});

const bodyText = await response.text();

if (!response.ok) {
	console.error(`Error ${response.status}: ${bodyText}`);
	process.exit(1);
}

console.log("Usuario inicial creado correctamente.");
console.log(bodyText);
