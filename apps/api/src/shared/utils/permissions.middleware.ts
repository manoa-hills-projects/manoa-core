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
import { and, eq } from "drizzle-orm";
import type { AppContext } from "./app-context";
import {
  profiles,
  profilePermissions,
  userProfiles,
} from "../database/schemas/rbac.schema";
import { SYSTEM_PROFILES } from "../constants/profiles";
import type { Module } from "../constants/modules";

/**
 * Cache compartido de permisos por usuario, respaldado por Cloudflare KV.
 *
 * Cada key: `perms:{userId}` → JSON `{ profileKey, allowedModules, viewModules }`.
 * TTL: 5 minutos (`expirationTtl` en KV). Si el binding `PERMISSIONS_CACHE`
 * no está presente (ej: tests o dev sin KV), el middleware degrada a
 * consulta directa a la base de datos en cada request.
 */
const CACHE_TTL_SECONDS = 5 * 60;
const CACHE_KEY_PREFIX = "perms:";

interface CachedPermissions {
  profileKey: string;
  allowedModules: string[]; // gestión (zona 3)
  viewModules: string[]; // vista (zonas 1/2)
}

const cacheKey = (userId: string) => `${CACHE_KEY_PREFIX}${userId}`;

/**
 * Obtiene los módulos permitidos para un usuario.
 *
 * Distingue entre permisos de GESTIÓN (zona 3) y de VISTA (zonas 1/2):
 * - Permisos de gestión: action != "view" → para requirePermission (zona 3)
 * - Permisos de vista: cualquier action → para acceso a zonas 1/2
 *
 * Filtra por `profiles.isActive = true`: un perfil desactivado se
 * comporta como "sin perfil asignado".
 *
 * @param db - Conexión a la base de datos (inyectada)
 * @param kv - Namespace KV para cache compartido (opcional; omitir en tests)
 * @param userId - ID del usuario autenticado
 * @returns `{ profileKey, allowedModules, viewModules }` o `null` si no tiene perfil activo
 */
export async function getUserPermissions(
  db: AppContext["Variables"]["db"],
  kv: KVNamespace | undefined,
  userId: string
): Promise<{
  profileKey: string;
  allowedModules: Set<string>; // gestión (zona 3)
  viewModules: Set<string>; // vista (zonas 1/2)
} | null> {
  // 1. Revisar cache KV
  if (kv) {
    const cached = await kv.get<CachedPermissions>(cacheKey(userId), "json");
    if (cached) {
      return {
        profileKey: cached.profileKey,
        allowedModules: new Set(cached.allowedModules),
        viewModules: new Set(cached.viewModules),
      };
    }
  }

  // 2. Buscar el perfil asignado al usuario (solo si el perfil está activo)
  const userProfile = await db
    .select({
      profileId: userProfiles.profileId,
      profileKey: profiles.key,
    })
    .from(userProfiles)
    .innerJoin(profiles, eq(userProfiles.profileId, profiles.id))
    .where(
      and(eq(userProfiles.userId, userId), eq(profiles.isActive, true))
    )
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

  const manageModules = perms
    .filter((p) => p.action !== "view")
    .map((p) => p.module);
  const viewModules = perms.map((p) => p.module);

  // 4. Guardar en cache KV con TTL
  if (kv) {
    const payload: CachedPermissions = {
      profileKey: userProfile.profileKey,
      allowedModules: manageModules,
      viewModules,
    };
    await kv.put(cacheKey(userId), JSON.stringify(payload), {
      expirationTtl: CACHE_TTL_SECONDS,
    });
  }

  return {
    profileKey: userProfile.profileKey,
    allowedModules: new Set(manageModules),
    viewModules: new Set(viewModules),
  };
}

/**
 * Invalida el cache de permisos para un usuario en KV.
 * Coherente entre isolates: cualquier worker verá la revocación en
 * la próxima lectura de esa key.
 */
export async function invalidatePermissionCache(
  kv: KVNamespace | undefined,
  userId: string
): Promise<void> {
  if (!kv) return;
  await kv.delete(cacheKey(userId));
}

/**
 * Invalida el cache de todos los usuarios asignados a un perfil dado.
 * Usar cuando cambian los permisos del perfil o su `isActive`.
 */
export async function invalidatePermissionCacheForProfile(
  db: AppContext["Variables"]["db"],
  kv: KVNamespace | undefined,
  profileId: string
): Promise<void> {
  if (!kv) return;
  const users = await db
    .select({ userId: userProfiles.userId })
    .from(userProfiles)
    .where(eq(userProfiles.profileId, profileId))
    .all();
  await Promise.all(users.map((u) => kv.delete(cacheKey(u.userId))));
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
    const kv = c.env.PERMISSIONS_CACHE;

    // 2. Obtener permisos del usuario (con cache KV compartido)
    const userPerms = await getUserPermissions(db, kv, userId);

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
    const kv = c.env.PERMISSIONS_CACHE;

    const userPerms = await getUserPermissions(db, kv, userId);

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
