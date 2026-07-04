/**
 * Middleware de Permisos RBAC (modelo simplificado por módulos)
 *
 * Verifica que el perfil del usuario tenga acceso a un módulo.
 * Modelo simplificado: si el perfil tiene CUALQUIER fila en
 * `profile_permissions` para el módulo → acceso concedido.
 * Sin granularidad por acción. `profiles.key` es la única fuente
 * de verdad; `user.role` de Better Auth no se usa para autorización.
 *
 * @module utils/permissions.middleware
 *
 * @example
 * // Uso en un router
 * import { requirePermission } from "../../shared/utils/permissions.middleware";
 * import { MODULES } from "../../shared/constants";
 *
 * router.get("/", requirePermission(MODULES.CITIZENS), handler);
 */

import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import type { AppContext } from "./app-context";
import {
  profiles,
  profilePermissions,
  userProfiles,
} from "../database/schemas/rbac.schema";
import { SYSTEM_PROFILES } from "../constants/profiles";
import type { Module } from "../constants/modules";

/**
 * Cache en memoria para permisos de usuario
 */
const permissionCache = new Map<
  string,
  {
    profileKey: string;
    allowedModules: Set<string>; // permisos de gestión (zona 3)
    viewModules: Set<string>; // permisos de vista (zonas 1/2)
    expiresAt: number;
  }
>();

/** Duración del cache en ms (5 minutos) */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Obtiene los módulos permitidos para un usuario.
 *
 * Distingue entre permisos de GESTIÓN (zona 3) y de VISTA (zonas 1/2):
 * - Permisos de gestión: action != "view" → para requirePermission (zona 3)
 * - Permisos de vista: cualquier action → para acceso a zonas 1/2
 *
 * @param db - Conexión a la base de datos (inyectada)
 * @param userId - ID del usuario autenticado
 * @returns `{ profileKey, allowedModules, viewModules }` o `null` si no tiene perfil
 */
export async function getUserPermissions(
  db: AppContext["Variables"]["db"],
  userId: string
): Promise<{
  profileKey: string;
  allowedModules: Set<string>; // gestión (zona 3)
  viewModules: Set<string>; // vista (zonas 1/2)
} | null> {
  // 1. Revisar cache
  const cached = permissionCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      profileKey: cached.profileKey,
      allowedModules: cached.allowedModules,
      viewModules: cached.viewModules,
    };
  }

  // 2. Buscar el perfil asignado al usuario
  const userProfile = await db
    .select({
      profileId: userProfiles.profileId,
      profileKey: profiles.key,
    })
    .from(userProfiles)
    .innerJoin(profiles, eq(userProfiles.profileId, profiles.id))
    .where(eq(userProfiles.userId, userId))
    .get();

  if (!userProfile) {
    return null;
  }

  // 3. Módulos con permisos de GESTIÓN (zona 3): acción != "view"
  // Los permisos con action="view" son solo para zonas 1/2 (lectura)
  const perms = await db
    .select({
      module: profilePermissions.module,
      action: profilePermissions.action,
    })
    .from(profilePermissions)
    .where(eq(profilePermissions.profileId, userProfile.profileId))
    .all();

  // Permisos de gestión (para requirePermission en zona 3)
  const manageModules = new Set(
    perms.filter((p) => p.action !== "view").map((p) => p.module)
  );

  // Permisos de vista (para zonas 1/2)
  const viewModules = new Set(perms.map((p) => p.module));

  // 4. Guardar en cache
  permissionCache.set(userId, {
    profileKey: userProfile.profileKey,
    allowedModules: manageModules,
    viewModules,
    expiresAt: Date.now() + CACHE_TTL,
  });

  return {
    profileKey: userProfile.profileKey,
    allowedModules: manageModules,
    viewModules,
  };
}

/**
 * Invalida el cache de permisos para un usuario
 */
export function invalidatePermissionCache(userId: string): void {
  permissionCache.delete(userId);
}

/**
 * Invalida todo el cache de permisos
 */
export function invalidateAllPermissionCache(): void {
  permissionCache.clear();
}

/**
 * Middleware que verifica si el perfil del usuario tiene acceso a un módulo.
 *
 * Reglas del modelo simplificado:
 * - `super_admin` → acceso total (short-circuit, sin consultar `profile_permissions`).
 * - Cualquier otro perfil → acceso si tiene CUALQUIER fila en
 *   `profile_permissions` para el módulo indicado.
 * - `citizen` → denegado en rutas admin (zona 3) porque sus permisos son de vista.
 *
 * @param module - Módulo al que se quiere acceder (Zona 3 / admin)
 * @returns Middleware de Hono que verifica el permiso
 *
 * @example
 * // Solo perfiles con el módulo "citizens" en profile_permissions
 * router.get("/", requirePermission(MODULES.CITIZENS), handler);
 */
export const requirePermission = (module: Module) => {
  return createMiddleware<AppContext>(async (c, next) => {
    const session = c.get("session");

    // 1. Verificar que hay sesión
    if (!session || !session.user) {
      return c.json(
        {
          error: "No autorizado",
          message: "Debe iniciar sesión para acceder a este recurso",
        },
        401
      );
    }

    const userId = session.user.id;
    const db = c.get("db");

    // 2. Obtener permisos del usuario (con cache)
    const userPerms = await getUserPermissions(db, userId);

    if (!userPerms) {
      return c.json(
        {
          error: "Sin perfil asignado",
          message:
            "Su usuario no tiene un perfil asignado. Contacte al administrador.",
        },
        403
      );
    }

    // 3. Super Admin tiene acceso total
    if (userPerms.profileKey === SYSTEM_PROFILES.SUPER_ADMIN) {
      c.set("permissionContext", {
        userId,
        profileKey: userPerms.profileKey,
        isSuperAdmin: true,
      });
      await next();
      return;
    }

    // 4. Verificar si tiene acceso al módulo (cualquier fila = acceso)
    const hasPermission = userPerms.allowedModules.has(module);

    if (!hasPermission) {
      return c.json(
        {
          error: "Acceso denegado",
          message: `No tiene permiso para acceder a este módulo (${module})`,
          details: {
            module,
            profileKey: userPerms.profileKey,
          },
        },
        403
      );
    }

    // 5. Agregar contexto a la request
    c.set("permissionContext", {
      userId,
      profileKey: userPerms.profileKey,
      isSuperAdmin: false,
      allowedModules: userPerms.allowedModules,
    });

    await next();
  });
};

/**
 * Middleware que verifica si el usuario es Super Admin
 */
export const requireSuperAdmin = () => {
  return createMiddleware<AppContext>(async (c, next) => {
    const session = c.get("session");

    if (!session || !session.user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const userId = session.user.id;
    const db = c.get("db");

    const userPerms = await getUserPermissions(db, userId);

    if (!userPerms || userPerms.profileKey !== SYSTEM_PROFILES.SUPER_ADMIN) {
      return c.json(
        {
          error: "Acceso denegado",
          message: "Esta acción requiere privilegios de Super Administrador",
        },
        403
      );
    }

    c.set("permissionContext", {
      userId,
      profileKey: userPerms.profileKey,
      isSuperAdmin: true,
    });

    await next();
  });
};

// ═══════════════════════════════════════════════════════════════
// EXTENSIÓN DEL CONTEXTO
// ═══════════════════════════════════════════════════════════════

/**
 * Contexto de permisos agregado a la request por el middleware
 */
export interface PermissionContext {
  userId: string;
  profileKey: string;
  isSuperAdmin: boolean;
  allowedModules?: Set<string>;
}

// Extender AppContext para incluir permissionContext
declare module "hono" {
  interface ContextVariableMap {
    permissionContext: PermissionContext;
  }
}
