# API (Cloudflare Workers)

## 1) Instalación

```txt
npm install
```

## 2) Entorno local (seguro)

Sin `.env` ni `.dev.vars`.

1. Crea el secreto en Secrets Store local (sin `--remote`):

```txt
npx wrangler secrets-store secret create <STORE_ID> --name BETTER_AUTH_SECRET --scopes workers
```

2. Ejecuta la API en entorno local:

```txt
npm run dev
```

> `npm run dev` usa `wrangler dev --env local`.

## 3) Entorno producción

Variables no sensibles (URLs públicas, etc.) viven en [wrangler.jsonc](wrangler.jsonc) bajo `env.production.vars`.

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

> `npm run deploy` usa `wrangler deploy --env production`.

## 4) Secrets Store (nivel cuenta) en Cloudflare

Recomendación para equipos: centralizar secretos en **Secrets Store** y asignarlos a los recursos necesarios (Workers, etc.) con RBAC.

> Estado: Open Beta.
>
> Nota: Secrets Store no está disponible en Cloudflare China Network (JD Cloud).

Flujo recomendado:

1. Crear cada secreto una sola vez en Secrets Store (nivel cuenta).
2. Definir permisos RBAC (quién puede crear/rotar/eliminar).
3. Asociar esos secretos al Worker `api` por entorno (`local`/`production`).
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
npm run dev
npm run dev:remote
npm run deploy
npm run cf-typegen
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass `CloudflareBindings` as generics when instantiating `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
