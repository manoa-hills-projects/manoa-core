import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import type { HonoConfig } from "../../index";
import { generateSHA256Hash } from "../../shared/utils/crypto.util";
import { documentCertifications, citizens } from "../../shared/database/schemas";

const certifications = new Hono<HonoConfig>();

// Schema for generating a new document certification
const generateCertificationSchema = z.object({
	documentType: z.string().min(1),
	residentId: z.string().uuid(),
	metadata: z.record(z.any()).optional(),
});

certifications.post(
	"/generar",
	zValidator("json", generateCertificationSchema),
	async (c) => {
		const { documentType, residentId, metadata } = c.req.valid("json");

		const db = c.get("db");

		// Validate resident exists
		const resident = await db
			.select()
			.from(citizens)
			.where(eq(citizens.id, residentId))
			.get();

		if (!resident) {
			return c.json({ error: "Resident not found" }, 404);
		}

		// Prepare data to hash (combining document type, resident ID, timestamp, and optional metadata)
		const timestamp = new Date().toISOString();
		const dataToHash = JSON.stringify({
			documentType,
			residentId,
			timestamp,
			metadata,
		});

		// Generate cryptographically secure hash
		const hash = await generateSHA256Hash(dataToHash);

		// Store the certification in the database
		const [certification] = await db
			.insert(documentCertifications)
			.values({
				documentType,
				residentId,
				hash,
				metadata: JSON.stringify(metadata || {}),
			})
			.returning();

		// Return the generated hash to the client
		return c.json({
			success: true,
			data: {
				hash: certification.hash,
				documentType: certification.documentType,
				createdAt: certification.createdAt,
			},
		});
	},
);

certifications.get("/verificar/:hash", async (c) => {
	const hash = c.req.param("hash");
	const db = c.get("db");

	// Fetch the certification using the hash, and include the resident details
	const certificationResult = await db
		.select({
			certification: documentCertifications,
			resident: citizens,
		})
		.from(documentCertifications)
		.innerJoin(citizens, eq(documentCertifications.residentId, citizens.id))
		.where(eq(documentCertifications.hash, hash))
		.get();

	if (!certificationResult) {
		return c.json({ error: "Document certification not found or invalid" }, 404);
	}

	const { certification, resident } = certificationResult;

	return c.json({
		success: true,
		data: {
			valid: true,
			documentType: certification.documentType,
			createdAt: certification.createdAt,
			metadata: certification.metadata ? JSON.parse(certification.metadata as string) : {},
			resident: {
				firstName: resident.firstName,
				lastName: resident.lastName,
				dni: resident.dni,
			},
		},
	});
});

export default certifications;
