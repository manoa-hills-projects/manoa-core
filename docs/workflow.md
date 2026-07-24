# Flujo de trabajo manoa-core

## Resumen

`manoa-core` solo mantiene un entorno productivo en Cloudflare. El desarrollo local no usa una base de datos ni recursos locales; en su lugar, `npm run dev` levanta la API y el dashboard en tu máquina pero se conecta de forma remota a los recursos reales de `prod` (D1, KV, R2, Queues, Durable Objects, etc.). Esto significa que **cada prueba local opera sobre datos reales de producción**.

## Pre-requisitos

Antes de levantar el entorno local asegúrate de tener:

- Node.js y npm compatibles con el `packageManager` del repositorio.
- `npm install` ejecutado en la raíz del monorepo (`manoa-core/`).
- `wrangler login` completado con una cuenta de Cloudflare que tenga permisos sobre:
  - Cloudflare Workers (API).
  - D1 (`manoa-db-master-prod`).
  - KV, R2, Queues y Durable Objects usados por el entorno `prod`.
- Acceso de escritura al repositorio para crear ramas y pull requests.

> `wrangler login` es obligatorio para desarrollo local contra D1 remoto. Sin autenticación, `wrangler dev --remote --env prod` no puede leer ni escribir en la base de datos de producción.

## Checklist de configuración inicial de credenciales

Usa esta lista la primera vez que configures el proyecto o cuando agregues un nuevo desarrollador.

### 1. Tu máquina local

- [ ] Ejecutar `npx wrangler login` y confirmar con `npx wrangler whoami`.
- [ ] Crear `apps/api/.dev.vars.prod` a partir de `apps/api/.dev.vars.example`.
- [ ] Llenar los valores reales de cada secreto.
- [ ] Crear `infrastructure/.env.local` a partir de `infrastructure/.env.example` (solo si usas Terraform localmente).

### 2. Subir secretos del Worker a Cloudflare

Existen dos formas. Elige la que prefieras:

**Opción A — script automático (recomendado):**

```bash
cd apps/api
node ./scripts/setup-secrets.mjs
```

El script lee `apps/api/.dev.vars.prod` y sube cada secreto a Cloudflare usando `wrangler secret bulk`.

**Opción B — manual:**

```bash
cd apps/api
npx wrangler secret put BETTER_AUTH_SECRET --env prod
npx wrangler secret put RESEND_API_KEY --env prod
npx wrangler secret put TURNSTILE_SECRET_KEY --env prod
npx wrangler secret put CF_BR_API_TOKEN --env prod
npx wrangler secret put BOOTSTRAP_ADMIN_KEY --env prod
```

### 3. Verificar secretos en Cloudflare

```bash
cd apps/api
npx wrangler secret list --env prod
```

Deberías ver: `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `CF_BR_API_TOKEN`, `BOOTSTRAP_ADMIN_KEY`.

### 4. Probar CI/CD nativo

- [ ] Hacer un cambio pequeño y subirlo a `main`.
- [ ] Revisar en Cloudflare Dashboard:
  - **Workers & Pages → manoa-api → Builds** para ver el build de la API.
  - **Workers & Pages → manoa-backoffice → Builds** para ver el build del dashboard.
- [ ] Confirmar que ambos builds terminan en verde.

## Cómo levantar local

Desde la raíz del monorepo:

```bash
npm run dev
```

Turborepo ejecuta simultáneamente:

- API (`apps/api`): `wrangler dev --remote --env prod` en `http://localhost:8787`.
- Dashboard (`apps/dashboard`): `vite dev --port 3000` en `http://localhost:3000`.

El dashboard en `localhost:3000` apunta a la API productiva remota (`https://manoa-api.manoa-it.workers.dev/api`) incluso en modo desarrollo, tal como se define en `apps/dashboard/.env.development`.

## Estructura del monorepo y cómo funciona CI/CD

El repositorio es un monorepo npm workspaces gestionado con Turborepo. Tiene dos aplicaciones principales bajo `apps/`:

| App | Directorio | Tecnología | Despliegue | CI/CD |
|-----|------------|------------|------------|-------|
| API | `apps/api` | Hono + Cloudflare Workers | Cloudflare Workers (`manoa-api-prod`) + AI worker (`manoa-ai-prod`) | Cloudflare Workers Builds |
| Dashboard | `apps/dashboard` | React + Vite + TanStack Router | Cloudflare Pages (`manoa-backoffice`) | Cloudflare Pages Git integration |

### CI/CD nativo de Cloudflare

No usamos GitHub Actions manuales. Cloudflare se conecta directamente al repo:

- **Workers Builds** (API):
  - Repo: `manoa-hills-projects/manoa-core`
  - Root directory: `/apps/api`
  - Deploy command: `npm run deploy`
  - Rama de producción: `main`

- **Pages Git integration** (Dashboard):
  - Repo: `manoa-hills-projects/manoa-core`
  - Root directory: `apps/dashboard`
  - Build command: `npm run build`
  - Build output: `dist`
  - Rama de producción: `main`

En cada push a `main`, Cloudflare construye y despliega automáticamente ambas apps.

### Secretos y variables

- **API**: los secretos sensibles (`BETTER_AUTH_SECRET`, `RESEND_API_KEY`, etc.) se leen desde **Cloudflare Secrets Store** mediante el binding configurado en `wrangler.jsonc`.
- **Dashboard**: las variables de build (`VITE_API_URL`, `VITE_API_ORIGIN`, etc.) se configuran en el dashboard de Cloudflare Pages.

> No se necesitan secrets ni variables en GitHub Actions. Terraform tampoco se ejecuta en CI/CD.

<div style="border: 2px solid #d32f2f; padding: 16px; background-color: #ffebee; color: #000;">

**ADVERTENCIA: ENTORNO LOCAL CONTRA PRODUCCIÓN**

Al desarrollar localmente se lee y se escribe en la **base de datos de producción real**. Cualquier cambio de datos afecta a usuarios reales: creación, modificación o eliminación de registros, envío de correos, generación de documentos, etc.

- No realices pruebas destructivas.
- No inserts masivos de datos de prueba.
- No ejecutes scripts de seed ni bootstrap contra `prod` salvo que sea una operación controlada y necesaria.
- Si necesitas modificar datos, hazlo de forma consciente y reversible cuando sea posible.

</div>

## Flujo de cambios

1. **Crear rama `feature` desde `main`:**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/nombre-descriptivo
   ```

2. **Implementar los cambios localmente.**

3. **Probar localmente contra producción con precaución.**

   - `npm run dev` en la raíz.
   - Verifica que el cambio funciona usando datos reales.
   - Evita alterar registros críticos o notificaciones a usuarios reales.

4. **Abrir un Pull Request a `main`.**

   - Incluye una descripción clara del cambio, el motivo y los riesgos.
   - Si el cambio toca el esquema de base de datos, documenta el plan de migración.

5. **Revisar y mergear el PR.**

   - Antes de mergear, asegúrate de que:
     - El código pasa lint y type-check (`biome check`, `tsc --noEmit`, etc.).
     - Los tests existentes pasan.
     - Se revisó el impacto en datos de producción.
     - Si aplica, se cuenta con un backup o plan de rollback.
   - Solo se mergea a `main` cuando la revisión esté aprobada.

6. **CI/CD despliega automáticamente a producción.**

   - `.github/workflows/deploy-prod.yml` se ejecuta cuando un push a `main` modifica `apps/api/**`. Despliega la API y el AI worker a `prod` usando `wrangler deploy`.
   - Terraform (`infrastructure/`) **no se ejecuta en CI/CD**. Solo se usa localmente para crear/modificar D1 y Queues cuando sea necesario.
   - `.github/workflows/deploy-dashboard-prod.yml` se ejecuta cuando un push a `main` modifica `apps/dashboard/**`. Construye el dashboard con `npm run build:prod` y lo despliega a Cloudflare Pages (`manoa-backoffice`).
   - Ninguno de los workflows aplica migraciones de base de datos automáticamente.

7. **Aplicar migraciones si es necesario.**

   - Si el PR incluye cambios de esquema, ejecuta manualmente `npm run db:push` en `apps/api` antes o después del deploy según el orden requerido por el cambio.
   - Nunca ejecutes `db:push` sin antes revisar el SQL generado.

## Migraciones

Cuando se modifica el esquema de D1:

1. Generar el archivo de migración:

   ```bash
   cd apps/api
   npm run db:generate
   ```

2. Revisar el SQL generado en `src/shared/database/migrations/`.

3. Aplicar la migración a la base de datos de producción:

   ```bash
   cd apps/api
   npm run db:push
   ```

   > `npm run db:push` ejecuta `wrangler d1 migrations apply manoa-db-master-prod --env prod`.

## Secrets

Los secretos se gestionan de dos formas:

### Opción A: `wrangler secret put` (directo en el Worker)

```bash
cd apps/api
npm run secrets:set:prod
# o equivalente:
wrangler secret put --env prod NOMBRE_DEL_SECRET
```

Repite por cada variable sensible (por ejemplo, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `BOOTSTRAP_ADMIN_KEY`).

### Opción B: Secrets Store (nivel cuenta)

Recomendado para equipos porque permite RBAC y rotación centralizada:

```bash
# Listar o crear el store
npx wrangler secrets-store store list --remote
npx wrangler secrets-store store create manoa-core-prod --remote

# Crear un secreto
npx wrangler secrets-store secret create <STORE_ID> --name BETTER_AUTH_SECRET --scopes workers --remote
```

Luego asocia el secreto al Worker `api` en el entorno `prod` y declara el binding correspondiente en `wrangler.jsonc`.

> Nunca incluyas valores de secrets en el repositorio.

## Troubleshooting

### Loop infinito de autenticación de Wrangler

Al ejecutar `npm run dev` Wrangler puede quedar en un ciclo de "Inicie sesión en Cloudflare". Esto suele ocurrir cuando Wrangler intenta resolver bindings que requieren autenticación remota en un entorno que no debería hacerlo.

**Solución:**

- Verifica que el binding de `secrets_store_secrets` en `wrangler.jsonc` no esté heredado indebidamente al entorno `prod` si usas `.dev.vars` o variables locales.
- Si usas Secrets Store, asegúrate de haber ejecutado `wrangler login` y de que el store esté creado en la cuenta correcta.
- Para más detalles, revisa la retrospectiva de implementación en [`implementacion_verificador_qr.md`](../implementacion_verificador_qr.md).

### Out of Memory (OOM) al compilar tipos con Drizzle

`npx tsc --noEmit` en `apps/api` puede fallar con `JavaScript heap out of memory` debido a la profundidad de inferencia de tipos de Drizzle.

**Solución:**

- Reinicia el TS Server de tu editor.
- Incrementa la memoria de Node.js:

  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit
  ```

- Este error no indica necesariamente un problema de sintaxis; el código puede estar correcto aunque el proceso de tipos consuma mucha memoria.

### La API local no se conecta a D1 remoto

- Confirma `wrangler login` y el perfil de cuenta activa.
- Verifica que `wrangler.jsonc` tenga el `database_id` de `manoa-db-master-prod` en `env.prod`.
- Revisa que `apps/api/package.json` ejecute `wrangler dev --remote --env prod`.

### El dashboard local apunta a localhost en lugar de a prod

- Verifica `apps/dashboard/.env.development`.
- Debe contener `VITE_API_URL="https://manoa-api.manoa-it.workers.dev/api"` y `VITE_API_ORIGIN="https://manoa-api.manoa-it.workers.dev"`.

## Referencias

- [`apps/api/README.md`](../apps/api/README.md)
- [`apps/api/wrangler.jsonc`](../apps/api/wrangler.jsonc)
- [`apps/api/package.json`](../apps/api/package.json)
- [`infrastructure/README.md`](../infrastructure/README.md)
- [`implementacion_verificador_qr.md`](../implementacion_verificador_qr.md)
- [`docs/system-diagrams.md`](./system-diagrams.md)
