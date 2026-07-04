# Sistema RBAC — Control de Acceso Basado en Perfiles

## 📋 Resumen

Manoa Core usa un sistema RBAC **simplificado** basado en una sola pregunta:

> **¿Este perfil puede gestionar este módulo?**

No hay granularidad por acción (`create`, `read`, `update`, ...). Si un perfil tiene acceso a un módulo, tiene acceso a toda su **Zona 3** (administración). Las zonas de transparencia y de "mis datos" se controlan solo con autenticación, no con permisos.

**Por qué simplificado:** el modelo anterior (perfil × módulo × acción × `allowed`) generaba tablas enormes, difícil de mantener y nunca se respetó en la práctica. El nuevo modelo es declarativo, se gestiona desde el panel, y deja claro qué puede hacer cada perfil sin matrices de cientos de celdas.

---

## 🎯 Conceptos Clave

### Perfiles

Un **perfil** agrupa los módulos que un usuario puede gestionar. Cada usuario tiene **exactamente un perfil** asignado (relación 1:1 vía `user_profiles`).

| Perfil | Descripción | Filas en `profile_permissions` | Protegido |
|--------|-------------|--------------------------------|-----------|
| `super_admin` | Acceso total al sistema (short-circuit en middleware) | **0 filas** | ✅ No editable ni eliminable |
| `citizen` | Vecino: acceso a transparencia y sus propios datos (zonas 1/2) | **8 filas de vista** | ✅ No eliminable (es el default de registro) |
| *Personalizados* | Ej: `tesorero`, `secretario`. Creados desde el panel. | **1 fila por módulo gestionado** | ❌ Editables y eliminables |

**Por qué `super_admin` tiene 0 filas:**
- `super_admin` hace **short-circuit** en el middleware: si `profileKey === "super_admin"`, se aprueba sin consultar `profile_permissions`. No necesita filas.

**Por qué `citizen` tiene filas de vista (no 0):**
- En el modelo **Option C (Mix)**, citizen tiene permisos de VISUALIZACIÓN para ver transparencia y sus propios datos (zonas 1/2): `houses.view`, `families.view`, `citizens.view`, `requests.view`, `polls.view`, `laws.view`, `ai.view`, `stats.view`.
- Citizen **NO** tiene permisos de gestión (zona 3). No puede crear/modificar/eliminar en ningún módulo.

### Permiso

Un **permiso** es **una fila** en `profile_permissions`:

```
{ profileId, module }   →  "este perfil puede gestionar este módulo (Zona 3)"
```

La existencia de la fila (con `allowed = true`) significa acceso. **No se lee la columna `action`** para autorización (queda como legacy del schema; el middleware ignora su valor). Un perfil personalizado que gestiona 3 módulos tiene exactamente 3 filas.

### Módulos

Áreas funcionales del sistema. Lista actual de `MODULES`:

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| `houses` | Gestión de viviendas | ✅ Implementado |
| `families` | Gestión de familias | ✅ Implementado |
| `citizens` | Gestión de ciudadanos (censo) | ✅ Implementado |
| `requests` | Solicitudes de documentos | ✅ Implementado |
| `documents` | Documentos generados | ✅ Implementado |
| `signatories` | Firmas y validaciones | ✅ Implementado |
| `validations` | Validación de documentos | ✅ Implementado |
| `polls` | Votaciones y asambleas | ✅ Implementado |
| `laws` | Leyes y normativas | ✅ Implementado |
| `ai` | Asistente IA | ✅ Implementado |
| `stats` | Estadísticas | ✅ Implementado |
| `reports` | Reportes | ✅ Implementado |
| `users` | Gestión de usuarios | ✅ Implementado |
| `profiles` | Gestión de perfiles y permisos | ✅ Implementado |
| `settings` | Configuración del sistema | ✅ Implementado |
| `events` | Eventos y calendario | 🔜 Planificado (fase posterior) |
| `treasury` | Tesorería y finanzas | 🔜 Planificado (fase posterior) |
| `payments` | Pagos y cuotas | 🔜 Planificado (fase posterior) |
| `tickets` | Tickets de mantenimiento | 🔜 Planificado (fase posterior) |
| `inventory` | Inventario de bienes | 🔜 Planificado (fase posterior) |

> **Nota:** Los 5 módulos marcados como 🔜 ya tienen su constante en `MODULES` (para que el RBAC los reconozca), pero sus routers y UI se implementan en fases posteriores. Los perfiles personalizados (tesorero, secretario) también se crean después desde el panel, **no** en el seed.

---

## 🗺️ Modelo de 3 Zonas

Cada módulo expone hasta 3 zonas de acceso. **El RBAC solo controla la Zona 3.** Las Zonas 1 y 2 requieren únicamente autenticación + perfil mínimo (`citizen`).

| Zona | Nombre | Quién accede | Cómo se protege |
|------|--------|--------------|-----------------|
| **Zona 1** | Transparencia | Cualquier autenticado | `requireAuth` (sin `requirePermission`) |
| **Zona 2** | Mis datos | El propio usuario | `requireAuth` + handler filtra por `session.user.id` |
| **Zona 3** | Administración | Perfiles con el módulo asignado | `requirePermission(module)` |

### Tabla de zonas por módulo

| Módulo | Zona 1 (Transparencia) | Zona 2 (Mis datos) | Zona 3 (Admin) |
|--------|------------------------|--------------------|----------------|
| `treasury` | Resumen de gastos | — | Gestionar finanzas |
| `payments` | — | Mis pagos/cuotas | Validar pagos móviles |
| `requests` | — | Mis solicitudes | Aprobar/rechazar |
| `documents` | — | Mis documentos | Generar documentos |
| `tickets` | — | Mis tickets | Asignar/resolver tickets |
| `polls` | Votaciones activas | Mis votos | Crear/cerrar votaciones |
| `events` | Calendario público | — | Crear eventos |
| `laws` | Normativas vigentes | — | Gestionar normativas |
| `citizens` | — | Mi ficha censal | Gestionar censo |
| `houses` | — | Mi vivienda | Gestionar viviendas |
| `families` | — | Mi familia | Gestionar familias |
| `ai` | — | Chat con IA | — |
| `users` | — | Mi perfil de usuario | Gestionar usuarios |
| `profiles` | — | — | Gestionar perfiles |
| `settings` | — | Config del consejo | Gestionar settings |

> **Nota de fase:** En la Fase 1 solo se sienta el núcleo RBAC que hace posible este modelo (middleware simplificado, sign-up con `citizen`, `/me/profile` exento, claves corregidas en frontend). La implementación de las Zonas 1 y 2 de cada módulo es Fase 2/3.

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│  USER  (Better Auth)                                     │
│  (id, name, email, ...)                                  │
│  ⚠️  user.role NO se lee para autorización.              │
│      Es metadata interna de Better Auth.                 │
└──────────────────────────────────────────────────────────┘
                        │
                        │  tiene (1:1) vía user_profiles
                        ▼
┌──────────────────────────────────────────────────────────┐
│  USER_PROFILE  (userId, profileId)                       │
└──────────────────────────────────────────────────────────┘
                        │
                        │  pertenece a (N:1)
                        ▼
┌──────────────────────────────────────────────────────────┐
│  PROFILE  (id, key, name, isSystem, isDefault, isActive) │
│  · key = única fuente de verdad para autorización        │
│  · super_admin → short-circuit en middleware             │
│  · citizen    → sin filas, solo rutas de comunidad       │
└──────────────────────────────────────────────────────────┘
                        │
                        │  tiene muchos
                        ▼
┌──────────────────────────────────────────────────────────┐
│  PROFILE_PERMISSIONS  (profileId, module)                │
│  · 1 fila = "este perfil gestiona este módulo (Zona 3)"  │
│  · La columna `action` es legacy: NO se lee para auth.   │
│  · super_admin: 0 filas (short-circuit).              │
│  · citizen: 8 filas de vista (houses, families...).    │
│  · Perfiles personalizados: 1 fila por módulo.           │
└──────────────────────────────────────────────────────────┘
```

**Fuente de verdad:** `profiles.key` es la **única** fuente de verdad para autorización. `user.role` (columna de Better Auth) se mantiene en el schema por compatibilidad con el plugin `admin` de Better Auth, pero **la aplicación nunca lo consulta** para decidir permisos.

---

## 🔧 API Backend

### `requirePermission(module)` — 1 solo argumento

Verifica que el perfil del usuario tenga el módulo en `profile_permissions`. Short-circuit para `super_admin`.

```typescript
import { requirePermission } from "../../shared/utils/permissions.middleware";
import { MODULES } from "../../shared/constants";

// Listar ciudadanos (Zona 3 del módulo citizens)
router.get("/", requirePermission(MODULES.CITIZENS), async (c) => {
  // Solo perfiles con citizens asignado (o super_admin) llegan aquí
  return c.json({ data: "..." });
});

// Aprobar una solicitud (Zona 3 del módulo requests)
router.post("/:id/approve", requirePermission(MODULES.REQUESTS), handler);

// Gestionar perfiles (Zona 3 del módulo profiles)
router.put("/:id/permissions", requirePermission(MODULES.PROFILES), handler);
```

> **No existe** `requireAnyPermission(...)` ni la variante de 2 argumentos `requirePermission(module, action)`. Si necesitas acceso a varios módulos, encadena middlewares o valida dentro del handler con `permissionContext`.

### `requireSuperAdmin()` — acciones críticas

Para operaciones que solo el super admin puede hacer (eliminar perfiles del sistema, reconfigurar el sistema, etc.).

```typescript
import { requireSuperAdmin } from "../../shared/utils/permissions.middleware";

router.delete("/profiles/:id", requireSuperAdmin(), handler);
```

### Rutas `/public/*` y `/mine/*` — solo `requireAuth`

Las Zonas 1 (Transparencia) y 2 (Mis datos) **no** usan `requirePermission`. Solo requieren autenticación. El handler filtra por `session.user.id` cuando son "mis datos".

```typescript
import { requireAuth } from "../../shared/utils/auth.util";

// Zona 1 — Transparencia: cualquier autenticado puede ver
router.get("/public/polls/active", requireAuth, handler);

// Zona 2 — Mis datos: el handler filtra por session.user.id
router.get("/mine/requests", requireAuth, async (c) => {
  const session = c.get("session");
  const db = c.get("db");
  // Solo las solicitudes del usuario actual
  const mine = await db.select().from(requests)
    .where(eq(requests.userId, session.user.id))
    .all();
  return c.json({ data: mine });
});
```

### `GET /api/me/profile` — exenta de permisos

El citizen no tiene `MODULES.USERS` asignado, pero necesita leer su propio perfil para que el frontend funcione. Por eso existe una ruta **exenta** de `requirePermission`:

```typescript
// Solo requireAuth. Devuelve el perfil de session.user.id.
router.get("/me/profile", requireAuth, async (c) => {
  const session = c.get("session");
  // ...devuelve perfil + permisos del usuario actual
});
```

El frontend (`usePermissions`) llama a esta ruta, **no** a `/api/profiles/users/:id/profile` (que sí requiere `MODULES.USERS`).

### Contexto de permisos en el handler

```typescript
router.get("/", requirePermission(MODULES.CITIZENS), async (c) => {
  const ctx = c.get("permissionContext");

  ctx.userId;        // ID del usuario
  ctx.profileKey;    // "super_admin" | "citizen" | "tesorero" | ...
  ctx.isSuperAdmin;  // true si es super admin
  ctx.allowedModules; // Set<string> de módulos (no presente en super_admin)
});
```

---

## 🎨 Frontend

### Hook `usePermissions()`

```typescript
import { usePermissions } from "@/hooks/use-permissions";

function MyComponent() {
  const { canManage, isSuperAdmin, isCitizen, profileKey } = usePermissions();

  // ¿Puede gestionar el módulo citizens (Zona 3)?
  if (canManage("citizens")) {
    return <Button>Gestionar ciudadanos</Button>;
  }

  // Renderizado condicional por perfil
  if (isSuperAdmin) return <AdminPanel />;
  if (isCitizen)    return <CitizenView />;

  // profileKey disponible para lógica personalizada
  return <div>Tu perfil: {profileKey}</div>;
}
```

API del hook:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `canManage(module)` | `(module: string) => boolean` | `true` si el perfil puede gestionar el módulo (Zona 3). Short-circuit para `super_admin`. |
| `isSuperAdmin` | `boolean` | `true` si `profileKey === "super_admin"` |
| `isCitizen` | `boolean` | `true` si `profileKey === "citizen"` |
| `profileKey` | `string \| null` | Clave del perfil del usuario |
| `isLoading` | `boolean` | Cargando sesión + perfil |
| `isError` | `boolean` | Error cargando permisos |

> El hook llama a `GET /api/me/profile` (ruta exenta) para obtener el perfil y los módulos asignados.

### `<ProtectedRoute>` — rutas admin

Para rutas de **Zona 3** (administración), usa la prop `module`:

```tsx
import { ProtectedRoute } from "@/shared/ui/protected-route";

// Ruta admin: requiere el módulo citizens
<ProtectedRoute module="citizens">
  <CitizensAdmin />
</ProtectedRoute>

// Ruta admin de perfiles (solo super_admin llega a gestionar perfiles)
<ProtectedRoute module="profiles">
  <ProfilesAdmin />
</ProtectedRoute>
```

### Rutas de comunidad (Zonas 1 y 2) — sin prop `module`

Las rutas de transparencia y "mis datos" **no** llevan prop `module`. Solo requieren estar autenticado (lo garantiza el layout `_authenticated`):

```tsx
// Zona 1 — Transparencia: cualquier autenticado
<Route path="/polls/active" component={ActivePolls} />

// Zona 2 — Mis datos: cualquier autenticado (el handler filtra por usuario)
<Route path="/my-requests" component={MyRequests} />
```

No envolver estas rutas en `<ProtectedRoute module="...">`: el citizen no tiene módulos asignados y sería bloqueado.

---

## 👥 Perfiles del Sistema

| Perfil | `key` | ¿Editable? | ¿Eliminable? | ¿Filas en `profile_permissions`? |
|--------|-------|------------|--------------|----------------------------------|
| Super Admin | `super_admin` | ❌ No | ❌ No | 0 (short-circuit) |
| Ciudadano | `citizen` | ✅ Sí (nombre/descripción) | ❌ No (es el default) | 0 |
| Personalizados | ej: `tesorero` | ✅ Sí | ✅ Sí | 1 por módulo gestionado |

**Por qué `citizen` no se elimina:** es el perfil que se asigna automáticamente en el registro público. Si se elimina, el sign-up rompe.

**Por qué `super_admin` no se edita ni elimina:** es la cuenta de recuperación. Si algo falla con los perfiles personalizados, el super admin siempre puede entrar y arreglarlo.

---

## 🚀 Inicialización

### 1. Seed de RBAC

```bash
curl -X POST https://tu-api.com/api/seed/seed-rbac
```

Crea **solo** los dos perfiles del sistema, **sin filas** en `profile_permissions`:

- `super_admin` (isSystem, no default)
- `citizen` (isSystem, isDefault)

> A diferencia del modelo anterior, el seed **no** inserta permisos. `super_admin` no los necesita (short-circuit) y `citizen` no los necesita (solo rutas de comunidad). Los perfiles personalizados se crean después desde el panel.

### 2. Crear Super Admin

```bash
curl -X POST https://tu-api.com/api/seed/seed-superadmin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@manoa.com",
    "password": "password-seguro",
    "name": "Administrador"
  }'
```

Esto:
1. Ejecuta el seed de RBAC (crea los perfiles del sistema).
2. Crea el usuario.
3. Le asigna el perfil `super_admin`.

### 3. Registro público de usuarios

Cuando un usuario se registra:

1. Se crea el usuario en la BD.
2. Se le asigna automáticamente el perfil `citizen` (default).
3. (Futuro) Si el registro valida contra el censo, se enlaza `citizens.userId = newUser.id`.

### 4. Crear perfiles personalizados

Desde el panel de administración (módulo `profiles`), el super admin crea perfiles como `tesorero` o `secretario` y les asigna los módulos que pueden gestionar. Cada módulo asignado inserta una fila en `profile_permissions`.

---

## ➕ Agregar un Nuevo Módulo

### 1. Agregar constante del módulo

```typescript
// apps/api/src/shared/constants/modules.ts
export const MODULES = {
  // ... módulos existentes
  NEW_MODULE: "new_module",
} as const;
```

### 2. Agregar etiqueta legible

```typescript
export const MODULE_LABELS: Record<Module, string> = {
  // ... etiquetas existentes
  [MODULES.NEW_MODULE]: "Nuevo Módulo",
};
```

### 3. Proteger las rutas admin con `requirePermission(module)`

```typescript
// apps/api/src/modules/new-module/new-module.router.ts
import { requirePermission } from "../../shared/utils/permissions.middleware";
import { MODULES } from "../../shared/constants";

// Zona 3 — Admin: requiere el módulo
router.get("/",          requirePermission(MODULES.NEW_MODULE), handler);
router.post("/",         requirePermission(MODULES.NEW_MODULE), handler);
router.delete("/:id",    requirePermission(MODULES.NEW_MODULE), handler);

// Zona 1/2 — Comunidad: solo requireAuth
router.get("/public/new-module",  requireAuth, handler);
router.get("/mine/new-module",    requireAuth, handler);
```

### 4. Asignar el módulo a perfiles desde el panel

Desde el panel de perfiles (módulo `profiles`), marca el nuevo módulo en los perfiles personalizados que deban gestionarlo. Esto inserta filas en `profile_permissions`. `super_admin` no necesita asignación (short-circuit).

### 5. Proteger la ruta frontend

```tsx
<ProtectedRoute module="new_module">
  <NewModuleAdmin />
</ProtectedRoute>
```

---

## 🔒 Seguridad

### Perfiles protegidos

- `super_admin` y `citizen` **no se pueden eliminar** (validación en el servicio de perfiles).
- `super_admin` **no se puede editar** (ni nombre ni clave).
- `citizen` se puede editar (nombre/descripción) pero no eliminar.

### Validaciones

- No se puede cambiar la `key` de un perfil del sistema.
- No se pueden eliminar perfiles con usuarios asignados (reasignar primero).
- No se pueden modificar permisos del perfil `super_admin` (no los usa, pero se bloquea por higiene).
- Solo `super_admin` puede crear/editar perfiles del sistema y asignar perfiles a usuarios.

### Principio de mínimo privilegio

- `citizen` parte de **cero** accesos a Zona 3. Solo se le añaden accesos creando un perfil personalizado.
- Los perfiles personalizados solo reciben los módulos explícitamente marcados.
- `requireSuperAdmin()` se reserva para acciones críticas (no para rutinas admin normales).

### Auditoría

Los cambios importantes se registran en `rbac_audit_logs`:

- Creación/edición/eliminación de perfiles.
- Cambios en `profile_permissions` (asignación de módulos a perfiles).
- Asignación de perfiles a usuarios.

---

## ⚡ Cache de Permisos

Para evitar consultar la BD en cada request, los permisos se cachean en memoria:

| Aspecto | Valor |
|---------|-------|
| **TTL** | 5 minutos (`CACHE_TTL = 5 * 60 * 1000`) |
| **Invalidación automática** | Al cambiar permisos de un perfil o asignar perfil a un usuario |
| **Invalidación manual (un usuario)** | `invalidatePermissionCache(userId)` |
| **Invalidación manual (todo)** | `invalidateAllPermissionCache()` |

**Por qué 5 minutos:** balance entre rendimiento y consistencia. Los cambios de permisos son poco frecuentes y se invalidan explícitamente; el TTL cubre el caso de reinicio o cambios externos a la app.

---

## 🐛 Troubleshooting

### "Sin perfil asignado" (403)

El usuario no tiene fila en `user_profiles`. Soluciones:

1. Si es un usuario nuevo registrado: el sign-up debería haberlo asignado. Verifica que el hook de sign-up asigna `citizen`.
2. Asignar manualmente desde el panel (módulo `users`) o vía API: `PUT /api/users/:id/profile`.
3. Si ni siquiera existe el perfil `citizen`: ejecutar el seed `POST /api/seed/seed-rbac`.

### "Perfil no encontrado"

El perfil `citizen` no existe en la BD. Solución:

```bash
curl -X POST https://tu-api.com/api/seed/seed-rbac
```

### El citizen no puede ver su propio perfil

El frontend debe llamar a `GET /api/me/profile` (ruta exenta), **no** a `GET /api/profiles/users/:id/profile` (que requiere `MODULES.USERS`). Si el frontend usa la ruta antigua, el citizen recibe 403.

### Los permisos no se actualizan tras un cambio

El cache puede estar desactualizado. Soluciones:

- Esperar 5 minutos (TTL del cache).
- Llamar `invalidatePermissionCache(userId)` desde el servicio que cambia permisos.
- O reiniciar el worker (limpia todo el cache).

### `super_admin` no entra a una ruta admin

El middleware hace short-circuit para `super_admin`, así que no debería pasar. Si pasa, verifica:

1. Que el usuario tenga `profileKey === "super_admin"` (consulta `user_profiles` + `profiles`).
2. Que la ruta use `requirePermission(module)` y no un middleware custom que ignore el short-circuit.

---

## 📝 Changelog

### Fase 2 (2026-06-25) — Option C (Mix): Citizen con permisos de comunidad

**Cambios en el modelo:**
- `citizen` ya no tiene 0 filas — ahora tiene **8 filas de VISUALIZACIÓN** para zonas 1/2: `houses.view`, `families.view`, `citizens.view`, `requests.view`, `polls.view`, `laws.view`, `ai.view`, `stats.view`
- Citizen **NO** tiene permisos de gestión (zona 3) — `canManage()` retorna `false` para zonas admin
- Los items del sidebar que requieren `permission` (houses, families, citizens, laws) se ocultan para citizen

**Routers migrados a `requirePermission`:**
- `requests.router.ts` — `GET /:id`, `PATCH /:id/review`
- `family.router.ts` — `POST`, `PATCH`, `DELETE`
- `citizen.router.ts` — `POST`, `PATCH`, `DELETE`
- `house.router.ts` — `POST`, `PATCH`, `DELETE`
- `laws.router.ts` — `POST /scrape`
- `settings.router.ts` — `PUT /profile`
- `signatories.router.ts` — `PUT /:role`
- `documents.router.ts` — `POST /`
- `reports.router.ts` — `GET /export`, `POST /import`
- `ai.router.ts` + `ai.handler.ts` — `GET /conversations/:id/messages` con ownership check

**Seed actualizado:**
- `database/seeds/rbac.seed.ts` — citizen recibe 8 filas de permisos de vista
- `shared/seed/rbac-seed.ts` — citizen recibe 8 filas de permisos de vista

### Fase 3 (2026-06-25) — Ownership checks en zonas 1/2

**Cambios:**
- `house.router.ts` — `GET /:id` con ownership check (cadena: userId → citizens → familyId → houses.id)
- `family.router.ts` — `GET /:id` con ownership check (verifica citizen.userId en la familia)
- `citizen.router.ts` — `GET /:id` reemplaza `requirePermission` por ownership check (citizen.user_id === session.user.id)
- `requests.router.ts` — `GET /:id` reemplaza `requirePermission` por ownership check (request.userId === session.user.id)
- `house.router.ts` — admin routes (POST, PATCH, DELETE) con `requirePermission(MODULES.HOUSES)`
- Fase 1 marcada como completada

**Modelo de ownership:**
- Zona 2 (mis datos): `GET /:id` verifica que `resource.userId === session.user.id` → 404 si no coincide (no revela existencia)
- Super_admin: short-circuit en todos los ownership checks
- `shared/seed/rbac-seed.ts` — citizen recibe 8 filas de permisos de vista

### Fase 1 (2026-06-18) — Núcleo RBAC simplificado

- Middleware `requirePermission(module)` con 1 argumento
- Short-circuit para `super_admin`
- `GET /api/profiles/me/profile` exenta de permisos
- `databaseHooks.user.create.after` asigna `citizen` automáticamente
- `usePermissions` + `ProtectedRoute` en frontend
- 13 rutas frontend migradas

---

## 📚 Referencias

- [Schema de BD](./database/schemas/rbac.schema.ts) — tablas `profiles`, `profile_permissions`, `user_profiles`
- [Constantes de módulos](./constants/modules.ts) — `MODULES`, `MODULE_LABELS`
- [Constantes de perfiles](./constants/profiles.ts) — `SYSTEM_PROFILES`, `isSystemProfile`, `isProfileDeletable`
- [Middleware de permisos](./utils/permissions.middleware.ts) — `requirePermission`, `requireSuperAdmin`, cache
- [Router de perfiles](../modules/profiles/profiles.router.ts) — endpoints de gestión de perfiles
- [Hook de permisos (frontend)](../../../../dashboard/src/hooks/use-permissions.ts) — `usePermissions`
- [ProtectedRoute (frontend)](../../../../dashboard/src/shared/ui/protected-route.tsx) — `<ProtectedRoute module="...">`
