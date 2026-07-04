import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { HonoConfig } from "../../index";
import {
  createPoll,
  findAllPolls,
  findOnePoll,
  findActivePolls,
  updatePollStatus,
  deletePoll,
  voteOnPoll,
} from "./polls.handler";
import {
  createPollDto,
  pollQueryDto,
  updatePollStatusDto,
  voteDto,
} from "./dto";
import { requirePermission } from "../../shared/utils/permissions.middleware";
import { MODULES } from "../../shared/constants";

export const pollsRouter = new Hono<HonoConfig>();

// Obtener todas las asambleas (Zona 1 - solo requiere auth, no requirePermission)
pollsRouter.get(
  "/",
  zValidator("query", pollQueryDto),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const query = c.req.valid("query");
    const result = await findAllPolls(db, query, session?.user?.id);
    return c.json(result);
  }
);

// Obtener votaciones activas (público - solo requiere autenticación)
pollsRouter.get(
  "/public/active",
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const result = await findActivePolls(db, session?.user?.id);
    return c.json(result);
  }
);

// Crear una asamblea
pollsRouter.post(
  "/",
  requirePermission(MODULES.POLLS),
  zValidator("json", createPollDto),
  async (c) => {
    const db = c.get("db");
    const body = c.req.valid("json");
    const result = await createPoll(db, body);
    return c.json(result, 201);
  }
);

// Obtener una asamblea específica
pollsRouter.get(
  "/:id",
  requirePermission(MODULES.POLLS),
  async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const session = c.get("session");
    const result = await findOnePoll(db, id, session?.user?.id);
    if (!result.data) {
      return c.json({ error: "Asamblea no encontrada" }, 404);
    }
    return c.json(result);
  }
);

// Actualizar el estado de una asamblea (Abrir/Cerrar)
pollsRouter.patch(
  "/:id/status",
  requirePermission(MODULES.POLLS),
  zValidator("json", updatePollStatusDto),
  async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const result = await updatePollStatus(db, id, body);
    return c.json(result);
  }
);

// Eliminar una asamblea
pollsRouter.delete(
  "/:id",
  requirePermission(MODULES.POLLS),
  async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const result = await deletePoll(db, id);
    return c.json(result);
  }
);

// Emitir un voto (Zona 2 - cualquier autenticado puede votar)
pollsRouter.post(
  "/:id/vote",
  zValidator("json", voteDto),
  async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const session = c.get("session");

    if (!session?.user?.id) {
      return c.json({ error: "Usuario no autenticado" }, 401);
    }

    try {
      const result = await voteOnPoll(db, id, session.user.id, body);
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
);
