/**
 * Generate a SHA-256 hash using the Web Crypto API, which is supported by Cloudflare Workers.
 * This helper is compatible with the Edge runtime and does not rely on Node.js `crypto`.
 *
 * @param content The string content to hash.
 * @returns {Promise<string>} The generated SHA-256 hash in hexadecimal.
 */
export async function generateSHA256Hash(content: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(content);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
		
	return hashHex;
}
