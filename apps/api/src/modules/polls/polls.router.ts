import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { AppContext } from "../../shared/utils/app-context";
import {
  createPoll,
  findAllPolls,
  findOnePoll,
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
import { requirePermission } from "../../shared/utils/permissions.middleware"; // Asumiendo que tienes un middleware para chequear permisos

export const pollsRouter = new Hono<AppContext>();

// Obtener todas las asambleas (Todos pueden ver)
pollsRouter.get(
  "/",
  requirePermission("project", "read"),
  zValidator("query", pollQueryDto),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const query = c.req.valid("query");
    
    // Pasamos el ID del usuario para saber si ya votó
    const result = await findAllPolls(db, query, session?.user?.id);
    return c.json(result);
  }
);

// Crear una asamblea (Solo Admin)
pollsRouter.post(
  "/",
  requirePermission("project", "create"),
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
  requirePermission("project", "read"),
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

// Actualizar el estado de una asamblea (Abrir/Cerrar) (Solo Admin)
pollsRouter.patch(
  "/:id/status",
  requirePermission("project", "update"),
  zValidator("json", updatePollStatusDto),
  async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    
    const result = await updatePollStatus(db, id, body);
    return c.json(result);
  }
);

// Eliminar una asamblea (Solo Admin)
pollsRouter.delete(
  "/:id",
  requirePermission("project", "delete"),
  async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    
    const result = await deletePoll(db, id);
    return c.json(result);
  }
);

// Emitir un voto (Habitantes)
pollsRouter.post(
  "/:id/vote",
  requirePermission("project", "vote"),
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
      // Si el error es por validaciones de negocio (ya votó, está cerrada)
      return c.json({ error: error.message }, 400);
    }
  }
);