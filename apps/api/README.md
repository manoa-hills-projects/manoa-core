# API (Cloudflare Workers)

## 1) Instalación

```txt
npm install
```

## 2) Entorno local (contra producción)

Este proyecto solo mantiene un entorno productivo. El desarrollo local se conecta directamente a los recursos de producción de Cloudflare.

### Requisitos previos

- Haber ejecutado `wrangler login` con una cuenta que tenga permisos sobre el Worker, D1, KV, R2 y Queues de producción.
- Haber ejecutado `npm install` en la raíz del monorepo.

### Advertencia

> `npm run dev` usa `wrangler dev --remote --env prod`, por lo que la API local lee y escribe en la **base de datos de producción real**. Cualquier cambio de datos afecta a usuarios reales. No realices pruebas destructivas ni inserts masivos de prueba.

### Levantar la API local

```txt
npm run dev
```

> `npm run dev` ejecuta `wrangler dev --remote --env prod`. Esto inicia el Worker localmente pero apunta a D1, KV, R2 y Queues del entorno `prod` definidos en [wrangler.jsonc](wrangler.jsonc).

## 3) Entorno producción

Variables no sensibles (URLs públicas, etc.) viven en [wrangler.jsonc](wrangler.jsonc) bajo `env.prod.vars`.

Secretos sensibles se cargan en Secrets Store (cuenta) y se enlazan al Worker:

```txt
npx wrangler secrets-store secret create <STORE_ID> --name BETTER_AUTH_SECRET --scopes workers --remote
npx wrangler secrets-store secret create <STORE_ID> --name RESEND_API_KEY --scopes workers --remote
npx wrangler secrets-store secret create <STORE_ID> --name TURNSTILE_SECRET_KEY --scopes workers --remote
npx wrangler secrets-store secret create <STORE_ID> --name BOOTSTRAP_ADMIN_KEY --scopes workers --remote
```

Despliegue a producción:

```txt
npm run deploy
```

> `npm run deploy` usa `wrangler deploy --env prod`. Los secretos deben estar configurados directamente en Cloudflare (vía `wrangler secret put --env prod` o Secrets Store), no en un archivo `.dev.vars` local.

## 4) Secrets Store (nivel cuenta) en Cloudflare

Recomendación para equipos: centralizar secretos en **Secrets Store** y asignarlos a los recursos necesarios (Workers, etc.) con RBAC.

> Estado: Open Beta.
>
> Nota: Secrets Store no está disponible en Cloudflare China Network (JD Cloud).

Flujo recomendado:

1. Crear cada secreto una sola vez en Secrets Store (nivel cuenta).
2. Definir permisos RBAC (quién puede crear/rotar/eliminar).
3. Asociar esos secretos al Worker `api` por entorno (`prod`).
4. Rotar periódicamente claves críticas (`BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `BOOTSTRAP_ADMIN_KEY`) sin exponer valores en repositorio.

### Comandos sugeridos (Wrangler)

Crear/listar store (cuenta):

```txt
npx wrangler secrets-store store list --remote
npx wrangler secrets-store store create manoa-core --remote
```

Crear secretos de cuenta (producción):

```txt
npx wrangler secrets-store secret create <STORE_ID> --name BETTER_AUTH_SECRET --scopes workers --remote
npx wrangler secrets-store secret create <STORE_ID> --name RESEND_API_KEY --scopes workers --remote
npx wrangler secrets-store secret create <STORE_ID> --name TURNSTILE_SECRET_KEY --scopes workers --remote
npx wrangler secrets-store secret create <STORE_ID> --name BOOTSTRAP_ADMIN_KEY --scopes workers --remote
```

Para desarrollo local con Secrets Store (sin `--remote`):

```txt
npx wrangler secrets-store secret create <STORE_ID> --name BETTER_AUTH_SECRET --scopes workers
```

Luego, declara los bindings `secrets_store_secrets` en [wrangler.jsonc](wrangler.jsonc) (ejemplo comentado incluido).

> Los scripts de seed/bootstrapping (`auth:bootstrap`, `seed`) ahora leen únicamente variables del entorno del proceso (por ejemplo exportadas en shell o inyectadas por CI), no desde archivos `.env`.

## 5) Comandos útiles

```txt
npm run dev              # wrangler dev --remote --env prod
npm run deploy           # wrangler deploy --env prod
npm run db:push          # aplicar migraciones pendientes a D1 de prod
npm run secrets:set:prod # rotar o agregar un secret en prod
npm run cf-typegen       # regenerar tipos de Cloudflare
```

[Para generar o sincronizar tipos basados en la configuración del Worker](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pasa `CloudflareBindings` como genérico al instanciar `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
