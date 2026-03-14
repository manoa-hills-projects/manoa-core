import { Hono } from "hono";
import type { HonoConfig } from "../../index";
import { getAllSignatories, updateSignatory } from "./signatories.handler";
import { SIGNATORY_ROLES } from "@/shared/database/schemas";

export const signatoriesRouter = new Hono<HonoConfig>()

    // GET /signatories — anyone can read (needed for PDF generation)
    .get("/", async (c) => {
        const db = c.get("db");
        const rows = await getAllSignatories(db);
        // Return as an ordered map by role
        const result = SIGNATORY_ROLES.map((role) => {
            const found = rows.find((r) => r.role === role);
            return found ?? { role, name: "", idNumber: "", signatureImage: null, id: "", createdAt: new Date(), updatedAt: null };
        });
        return c.json({ data: result }, 200);
    })

    // PUT /signatories/:role — admin only, accepts multipart/form-data
    .put("/:role", async (c) => {
        const db = c.get("db");
        const session = c.get("session") as { user?: { role?: string } } | undefined;
        const userRole = session?.user?.role ?? "user";

        if (userRole !== "admin" && userRole !== "superadmin") {
            return c.json({ message: "No autorizado" }, 403);
        }

        const signatoryRole = c.req.param("role");
        if (!SIGNATORY_ROLES.includes(signatoryRole as (typeof SIGNATORY_ROLES)[number])) {
            return c.json({ message: "Rol de firmante inválido" }, 400);
        }

        // Parse multipart form data
        const formData = await c.req.formData();
        const name = (formData.get("name") as string | null) ?? "";
        const idNumber = (formData.get("idNumber") as string | null) ?? "";
        const imageFile = formData.get("signatureImage");

        // Validate text fields
        if (name.length > 150 || idNumber.length > 20) {
            return c.json({ message: "Campos demasiado largos" }, 400);
        }

        // Convert image to base64 if provided
        let signatureImage: string | null | undefined = undefined; // undefined = don't touch

        if (imageFile instanceof File && imageFile.size > 0) {
            // Validate type
            if (!["image/png", "image/jpeg"].includes(imageFile.type)) {
                return c.json({ message: "Solo se aceptan imágenes PNG o JPG" }, 400);
            }
            // Validate size (max 500 KB)
            if (imageFile.size > 512_000) {
                return c.json({ message: "La imagen no debe superar 500 KB" }, 400);
            }
            const arrayBuf = await imageFile.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf)));
            signatureImage = `data:${imageFile.type};base64,${base64}`;
        } else if (formData.has("clearSignature") && formData.get("clearSignature") === "1") {
            // Explicit clear
            signatureImage = null;
        }

        const updated = await updateSignatory(
            db,
            signatoryRole as (typeof SIGNATORY_ROLES)[number],
            { name, idNumber, signatureImage },
        );
        return c.json({ data: updated }, 200);
    });

