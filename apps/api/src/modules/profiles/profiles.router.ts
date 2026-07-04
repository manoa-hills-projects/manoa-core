/**
 * Router de Perfiles RBAC
 *
 * Define los endpoints para la gestión de perfiles y permisos
 * del sistema de control de acceso.
 *
 * @module modules/profiles/router
 *
 * @example
 * // Endpoints disponibles:
 * GET    /api/profiles              → Listar perfiles
 * GET    /api/profiles/:id          → Obtener perfil por ID
 * POST   /api/profiles              → Crear perfil personalizado
 * PATCH  /api/profiles/:id          → Actualizar perfil
 * DELETE /api/profiles/:id          → Eliminar perfil (no system)
 * GET    /api/profiles/:id/permissions → Obtener permisos del perfil
 * PUT    /api/profiles/:id/permissions → Actualizar permisos del perfil
 * GET    /api/profiles/me/profile  → Perfil del usuario autenticado (EXENTO de RBAC)
 * GET    /api/users/:id/profile     → Obtener perfil de un usuario
 * PUT    /api/users/:id/profile     → Asignar perfil a usuario
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { HonoConfig } from "../../index";
import {
  createProfileSchema,
  updateProfileSchema,
  updatePermissionsSchema,
  assignProfileSchema,
  profileQuerySchema,
} from "./dto";
import {
  findAllProfiles,
  findProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  updatePermissions,
  assignProfileToUser,
  getUserProfile,
  ProfileError,
  ProfileNotFoundError,
  ProfileProtectedError,
  ProfileKeyExistsError,
} from "./profiles.handler";
import { requirePermission } from "../../shared/utils/permissions.middleware";
import { MODULES } from "../../shared/constants";

export const profilesRouter = new Hono<HonoConfig>();

// ═══════════════════════════════════════════════════════════════
// LISTAR PERFILES
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/profiles
 *
 * Lista todos los perfiles del sistema con filtros opcionales.
 * Requiere permiso: profiles.read
 */
profilesRouter.get(
  "/",
  requirePermission(MODULES.PROFILES),
  zValidator("query", profileQuerySchema),
  async (c) => {
    try {
      const db = c.get("db");
      const query = c.req.valid("query");

      const result = await findAllProfiles(db, query);

      return c.json(result);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// OBTENER PERFIL POR ID
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/profiles/:id
 *
 * Obtiene un perfil específico con sus permisos.
 * Requiere permiso: profiles.read
 */
profilesRouter.get(
  "/:id",
  requirePermission(MODULES.PROFILES),
  async (c) => {
    try {
      const db = c.get("db");
      const id = c.req.param("id");

      const result = await findProfileById(db, id);

      if (!result) {
        throw new ProfileNotFoundError(id);
      }

      return c.json(result);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// CREAR PERFIL
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/profiles
 *
 * Crea un nuevo perfil personalizado.
 * Requiere permiso: profiles.create
 */
profilesRouter.post(
  "/",
  requirePermission(MODULES.PROFILES),
  zValidator("json", createProfileSchema),
  async (c) => {
    try {
      const db = c.get("db");
      const session = c.get("session");
      const data = c.req.valid("json");

      if (!session?.user?.id) {
        return c.json({ error: "No autorizado" }, 401);
      }

      const result = await createProfile(db, data, session.user.id);

      return c.json(result, 201);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// ACTUALIZAR PERFIL
// ═══════════════════════════════════════════════════════════════

/**
 * PATCH /api/profiles/:id
 *
 * Actualiza un perfil existente.
 * Requiere permiso: profiles.update
 */
profilesRouter.patch(
  "/:id",
  requirePermission(MODULES.PROFILES),
  zValidator("json", updateProfileSchema),
  async (c) => {
    try {
      const db = c.get("db");
      const session = c.get("session");
      const id = c.req.param("id");
      const data = c.req.valid("json");

      if (!session?.user?.id) {
        return c.json({ error: "No autorizado" }, 401);
      }

      const result = await updateProfile(db, c.env.PERMISSIONS_CACHE, id, data, session.user.id);

      return c.json(result);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// ELIMINAR PERFIL
// ═══════════════════════════════════════════════════════════════

/**
 * DELETE /api/profiles/:id
 *
 * Elimina un perfil personalizado (no del sistema).
 * Requiere permiso: profiles.delete
 */
profilesRouter.delete(
  "/:id",
  requirePermission(MODULES.PROFILES),
  async (c) => {
    try {
      const db = c.get("db");
      const session = c.get("session");
      const id = c.req.param("id");

      if (!session?.user?.id) {
        return c.json({ error: "No autorizado" }, 401);
      }

      const result = await deleteProfile(db, id, session.user.id);

      return c.json(result);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// OBTENER PERMISOS DEL PERFIL
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/profiles/:id/permissions
 *
 * Obtiene los permisos de un perfil específico.
 * Requiere permiso: profiles.read
 */
profilesRouter.get(
  "/:id/permissions",
  requirePermission(MODULES.PROFILES),
  async (c) => {
    try {
      const db = c.get("db");
      const id = c.req.param("id");

      const result = await findProfileById(db, id);

      if (!result) {
        throw new ProfileNotFoundError(id);
      }

      return c.json({
        profileId: id,
        profileName: result.name,
        permissions: result.permissions,
      });
    } catch (error) {
      return handleError(c, error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// ACTUALIZAR PERMISOS DEL PERFIL
// ═══════════════════════════════════════════════════════════════

/**
 * PUT /api/profiles/:id/permissions
 *
 * Actualiza los permisos de un perfil.
 * Requiere permiso: profiles.manage
 */
profilesRouter.put(
  "/:id/permissions",
  requirePermission(MODULES.PROFILES),
  zValidator("json", updatePermissionsSchema),
  async (c) => {
    try {
      const db = c.get("db");
      const session = c.get("session");
      const id = c.req.param("id");
      const data = c.req.valid("json");

      if (!session?.user?.id) {
        return c.json({ error: "No autorizado" }, 401);
      }

      const result = await updatePermissions(db, c.env.PERMISSIONS_CACHE, id, data, session.user.id);

      return c.json(result);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// PERFIL DEL USUARIO AUTENTICADO (EXENTO DE RBAC)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/profiles/me/profile
 *
 * Devuelve el perfil y los permisos del usuario actualmente autenticado.
 *
 * EXENCIÓN DE RBAC: Esta ruta NO aplica `requirePermission` porque
 * cualquier usuario autenticado puede consultar su propio perfil. El
 * middleware `requireAuth` (aplicado a `/profiles/*` en index.ts)
 * garantiza que existe una sesión válida; el handler filtra siempre
 * por `session.user.id` y nunca por un parámetro de ruta, de modo que
 * el ciudadano (sin permiso sobre MODULES.USERS) no queda bloqueado.
 *
 * Si el usuario no tiene perfil asignado, responde 200 con
 * `profile: null` y `permissions: []`, coherente con el contrato de
 * `GET /api/profiles/users/:id/profile`.
 *
 * @note No usa `requirePermission(MODULES.USERS)` a propósito.
 */
profilesRouter.get("/me/profile", async (c) => {
  try {
    const db = c.get("db");
    const session = c.get("session") as { user?: { id: string } } | undefined;

    // Validación de boundary: sesión presente (defense in depth;
    // requireAuth ya garantiza esto a nivel de /profiles/*).
    if (!session?.user?.id) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const userId = session.user.id;
    const result = await getUserProfile(db, userId);

    if (!result) {
      return c.json({
        userId,
        profile: null,
        permissions: [],
        message: "El usuario no tiene perfil asignado",
      });
    }

    return c.json(result);
  } catch (error) {
    return handleError(c, error);
  }
});

// ═══════════════════════════════════════════════════════════════
// OBTENER PERFIL DE USUARIO
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/users/:id/profile
 *
 * Obtiene el perfil asignado a un usuario.
 * Requiere permiso: users.read
 */
profilesRouter.get(
  "/users/:id/profile",
  requirePermission(MODULES.USERS),
  async (c) => {
    try {
      const db = c.get("db");
      const userId = c.req.param("id");

      const result = await getUserProfile(db, userId);

      if (!result) {
        return c.json({
          userId,
          profile: null,
          permissions: [],
          message: "El usuario no tiene perfil asignado",
        });
      }

      return c.json(result);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// ASIGNAR PERFIL A USUARIO
// ═══════════════════════════════════════════════════════════════

/**
 * PUT /api/users/:id/profile
 *
 * Asigna un perfil a un usuario.
 * Requiere permiso: users.manage
 */
profilesRouter.put(
  "/users/:id/profile",
  requirePermission(MODULES.USERS),
  zValidator("json", assignProfileSchema),
  async (c) => {
    try {
      const db = c.get("db");
      const session = c.get("session");
      const userId = c.req.param("id");
      const data = c.req.valid("json");

      if (!session?.user?.id) {
        return c.json({ error: "No autorizado" }, 401);
      }

      const result = await assignProfileToUser(
        db,
        c.env.PERMISSIONS_CACHE,
        userId,
        data,
        session.user.id
      );

      return c.json(result);
    } catch (error) {
      return handleError(c, error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// MANEJO DE ERRORES
// ═══════════════════════════════════════════════════════════════

/**
 * Maneja errores conocidos y devuelve respuesta JSON apropiada
 */
function handleError(c: any, error: unknown) {
  console.error("[profiles-router] Error:", error);

  if (error instanceof ProfileNotFoundError) {
    return c.json({ error: error.message }, 404);
  }

  if (error instanceof ProfileProtectedError) {
    return c.json({ error: error.message }, 403);
  }

  if (error instanceof ProfileKeyExistsError) {
    return c.json({ error: error.message }, 409);
  }

  if (error instanceof ProfileError) {
    return c.json({ error: error.message }, error.statusCode);
  }

  return c.json(
    {
      error: "Error interno del servidor",
      message: error instanceof Error ? error.message : "Error desconocido",
    },
    500
  );
}
