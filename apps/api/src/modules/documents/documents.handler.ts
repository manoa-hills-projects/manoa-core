import * as schema from "@/shared/database/schemas";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { buildSingleData } from "@/shared/utils/api-reponse";
import type { CreateDocumentInput } from "./dto/documents.dto";

export const certifyDocument = async (
  db: DrizzleD1Database<typeof schema>,
  data: CreateDocumentInput,
  userId: string
) => {
  const newId = crypto.randomUUID();
  const rawData = `${newId}-${data.documentType}-${data.citizenId}-${userId}-${Date.now()}`;
  const strBuf = new TextEncoder().encode(rawData);
  const hashBuf = await crypto.subtle.digest("SHA-256", strBuf);
  const hashArray = Array.from(new Uint8Array(hashBuf));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const [result] = await db
    .insert(schema.documentCertifications)
    .values({
      id: newId,
      documentType: data.documentType,
      citizenId: data.citizenId,
      issuedBy: userId,
      hash: hashHex,
    })
    .returning();

  return buildSingleData({
    id: result.id,
    documentType: result.documentType,
    citizenId: result.citizenId,
    hash: result.hash,
    issuedAt: result.issuedAt,
    issuedBy: result.issuedBy,
    status: result.status,
  });
};

export const verifyDocument = async (
  db: DrizzleD1Database<typeof schema>,
  id: string
) => {
  const result = await db
    .select({
      id: schema.documentCertifications.id,
      documentType: schema.documentCertifications.documentType,
      citizenId: schema.documentCertifications.citizenId,
      hash: schema.documentCertifications.hash,
      issuedAt: schema.documentCertifications.issuedAt,
      status: schema.documentCertifications.status,
      citizenNames: schema.citizens.firstName,
      citizenSurnames: schema.citizens.lastName,
      citizenDni: schema.citizens.dni,
    })
    .from(schema.documentCertifications)
    .leftJoin(schema.citizens, eq(schema.citizens.id, schema.documentCertifications.citizenId))
    .where(eq(schema.documentCertifications.id, id))
    .get();

  if (!result || result.status !== "VALID") {
    return { data: null, error: "Documento inválido o revocado" };
  }

  return { data: buildSingleData(result), error: null };
};
