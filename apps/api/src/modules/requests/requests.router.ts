import { Hono } from "hono";
import type { HonoConfig } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
    createRequest,
    findAllRequests,
    findOneRequest,
    reviewRequest,
    generateRequestDocument,
} from "./requests.handler";
import { createRequestDto } from "./dto/create-request.dto";
import { reviewRequestDto } from "./dto/review-request.dto";

const queryDto = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    mine: z.enum(["true", "false"]).optional(),
});

export const requestsRouter = new Hono<HonoConfig>()

    // GET /requests — admins see all, normal users see their own
    .get("/", zValidator("query", queryDto), async (c) => {
        const db = c.get("db");
        const session = c.get("session") as { user?: { id: string; role?: string } } | undefined;
        const userId = session?.user?.id ?? "";
        const role = session?.user?.role ?? "user";
        const { page, limit, mine } = c.req.valid("query");

        const isAdmin = role === "admin" || role === "superadmin";
        const filterByUser = !isAdmin || mine === "true" ? userId : undefined;

        const result = await findAllRequests(db, { page, limit, userId: filterByUser });
        return c.json(result, 200);
    })

    // POST /requests — any authenticated user can create
    .post("/", zValidator("json", createRequestDto), async (c) => {
        const db = c.get("db");
        const session = c.get("session") as { user?: { id: string } } | undefined;
        const userId = session?.user?.id ?? "";
        const data = c.req.valid("json");

        const result = await createRequest(db, userId, data);
        return c.json(result, 201);
    })

    // GET /requests/:id
    .get("/:id", async (c) => {
        const db = c.get("db");
        const id = c.req.param("id");
        const result = await findOneRequest(db, id);

        if (!result.data) return c.json({ message: "No encontrado" }, 404);
        return c.json(result, 200);
    })

    // PATCH /requests/:id/review — admin/superadmin only
    .patch("/:id/review", zValidator("json", reviewRequestDto), async (c) => {
        const db = c.get("db");
        const session = c.get("session") as { user?: { id: string; role?: string } } | undefined;
        const userId = session?.user?.id ?? "";
        const role = session?.user?.role ?? "user";

        if (role !== "admin" && role !== "superadmin") {
            return c.json({ message: "No autorizado" }, 403);
        }

        const id = c.req.param("id");
        const data = c.req.valid("json");

        try {
            const result = await reviewRequest(db, id, userId, data);
            if (!result) return c.json({ message: "No encontrado" }, 404);
            return c.json(result, 200);
        } catch (e) {
            const message = e instanceof Error ? e.message : "Error al revisar la solicitud";
            return c.json({ message }, 400);
        }
    })

    // GET /requests/:id/document — download the generated PDF
    .get("/:id/document", async (c) => {
        const db = c.get("db");
        const session = c.get("session") as { user?: { id: string; role?: string } } | undefined;
        const userId = session?.user?.id ?? "";
        const role = session?.user?.role ?? "user";
        const isAdmin = role === "admin" || role === "superadmin";
        const id = c.req.param("id");

        try {
            const pdfBytes = await generateRequestDocument(db, id, userId, isAdmin);
            return new Response(pdfBytes, {
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="carta-de-residencia-${id}.pdf"`,
                },
            });
        } catch (e) {
            const message = e instanceof Error ? e.message : "Error al generar el documento";
            const status = message.includes("No autorizado") ? 403
                : message.includes("No encontrada") ? 404
                    : 400;
            return c.json({ message }, status as 400 | 403 | 404);
        }
    });
