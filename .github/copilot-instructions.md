# Manoa Core - Copilot Instructions

Welcome to the `manoa-core` monorepo. This guide outlines the project's architecture, tools, and coding conventions. Use this context when reasoning about the codebase or writing code.

## 🏗️ Architecture & Stack overview
This is a Turborepo-managed monorepo containing a full-stack application using **npm**.
* **Backend (`apps/api/`)**: Hono on Cloudflare Workers, Better Auth, Drizzle ORM, Cloudflare D1.
* **Frontend (`apps/dashboard/`)**: React 19, Vite, TanStack Router, TanStack Query, Tailwind CSS v4, Shadcn UI.
* **Tooling**: Biome (Linting & Formatting), Vitest, TypeScript, Turbo.

## 🔌 Backend Patterns (`apps/api/`)
* **Modules**: Business logic is separated by domain into `src/modules/<subject>/`.
* **Routers (`<subject>.router.ts`)**: Define endpoints by chaining `.get`/`.post` on `Hono`. Use `@hono/zod-validator` for request validation (e.g., `zValidator("json", createDto)`).
* **Handlers (`<subject>.handler.ts`)**: Keep HTTP parsing out of handlers. Handlers take explicit parameters like strictly-typed Drizzle DB instances (`DrizzleD1Database<typeof schema>`) and parsed payload data.
* **Responses**: Avoid returning raw objects. Use utility functions from `src/shared/utils/api-reponse.ts` such as `buildSingleData(result)` or `buildPaginatedData(rows, total, page, limit)`.
* **Database**: All Drizzle schemas are centralized under `src/shared/database/schemas/`. When modifying schemas, generate migrations via `npm run db:generate`.

## 🖥 Frontend Patterns (`apps/dashboard/`)
* **Feature-Sliced Design (FSD)**: The application structure adheres to FSD principles:
  * `shared/`: Generic Shadcn UI components and API client configurations.
  * `entities/`: Domain models, API hooks, and entity-specific configurations (e.g. `useHouses()`, types).
  * `widgets/`: Composed standalone components (e.g., `app-sidebar`, `house-table`).
  * `routes/`: File-based routes for TanStack Router (`__root.tsx` for layout mappings).
* **Data Fetching**: Use `ky` from `src/shared/api/api-client.ts`, combined with `@tanstack/react-query`. Anticipate backend responses wrapped in `ApiResponse<T>` with `metadata` for paginated queries.
* **Component Installation**: Use the latest Shadcn CLI syntax when scaffolding new UI elements: `pnpm dlx shadcn@latest add <component>`.
* **Styling**: Tailwind CSS v4 is configured without plugins.

## 🛠️ Developer Workflows & Commands
* **Run App**: Use `npm run dev` in the project root to leverage Turbo.
* **Format & Lint**: Do not rely on ESLint/Prettier defaults; the project exclusively uses Biome (`npm run format`, `npm run lint`, `npm run check` in `apps/dashboard`).
* **Migrations**: Apply locally via `npx wrangler d1 migrations apply sigcc-manoa-db --local` inside `apps/api`.
* **Types**: Generate worker configurations via `npm run cf-typegen` in `apps/api`.

## ⚠️ Important Conventions
* Both packages are ES Modules (`"type": "module"`). Always use ES `import`/`export`.
* Always resolve types explicitly. Avoid implicit `any`.

## 🤖 Automantenimiento de Estándares (Agent Self-Maintenance)
* **Living Documentation**: Si descubres nuevos patrones, resuelves confusiones sobre la arquitectura o estableces un nuevo estándar durante una tarea, DEBES actualizar proactivamente este archivo `.github/copilot-instructions.md` para mantener los estándares del proyecto siempre actualizados.