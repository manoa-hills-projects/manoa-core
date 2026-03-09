
const API_BASE_URL = process.env.API_BASE_URL ?? "https://manoa-api-production.manoa-it.workers.dev";
const BOOTSTRAP_ADMIN_KEY = process.env.BOOTSTRAP_ADMIN_KEY;
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Administrador";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ORIGIN = process.env.BOOTSTRAP_ORIGIN ?? new URL(API_BASE_URL).origin;

if (!BOOTSTRAP_ADMIN_KEY) {
	console.error("Falta BOOTSTRAP_ADMIN_KEY en variables de entorno");
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
