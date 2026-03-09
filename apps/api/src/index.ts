import { drizzle } from 'drizzle-orm/d1'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { count } from 'drizzle-orm'
import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'
import * as schema from "./shared/database/schemas"
import housesRouter from './modules/house/house.router'
import familiesRouter from './modules/family/family.router'
import citizensRouter from './modules/citizen/citizen.router'
import reportsRouter from './modules/reports/reports.router'
import aiRouter from './modules/ai/ai.router'
import { pollsRouter } from './modules/polls/polls.router'
import { logger } from 'hono/logger'
import { etag } from 'hono/etag'
import { getAuth } from './shared/utils/auth.util'
import { ChatAgent } from './modules/ai/chat-agent'
import { routeAgentRequest } from 'agents'
import { seedRouter } from './modules/seed';

type Bindings = {
  DB: D1Database
  BETTER_AUTH_SECRET: string | { get: () => Promise<string> };
  TURNSTILE_SECRET_KEY?: string | { get: () => Promise<string> };
  RESEND_API_KEY?: string | { get: () => Promise<string> };
  BOOTSTRAP_ADMIN_KEY?: string | { get: () => Promise<string> };
  AI?: {
    run: (model: string, input: unknown) => Promise<unknown>
  }
  AI_MODEL?: string
  BETTER_AUTH_URL?: string;
  DASHBOARD_ORIGIN?: string;
  RESEND_FROM_EMAIL?: string;
  ChatAgent: DurableObjectNamespace;
}

type RuntimeSecrets = {
  betterAuthSecret: string
  resendApiKey?: string
  turnstileSecret?: string
  bootstrapAdminKey?: string
}

type Variables = {
  db: DrizzleD1Database<typeof schema>
  auth: ReturnType<typeof getAuth>
  runtimeSecrets: RuntimeSecrets
  session?: unknown
}

export type HonoConfig = { Bindings: Bindings, Variables: Variables };

const DEFAULT_DASHBOARD_ORIGIN = "http://localhost:3000";

const resolveAuthBaseUrl = (envBaseUrl: string | undefined, requestUrl: string) => {
  const requestOrigin = new URL(requestUrl).origin;

  if (!envBaseUrl) {
    return `${requestOrigin}/api/auth`;
  }

  const normalized = envBaseUrl.replace(/\/+$/, "");

  if (normalized.endsWith("/api/auth")) {
    return normalized;
  }

  return `${normalized}/api/auth`;
};

const isSecretsStoreBinding = (
  value: unknown,
): value is { get: () => Promise<string> } => {
  return typeof value === "object"
    && value !== null
    && "get" in value
    && typeof (value as { get?: unknown }).get === "function";
};

const resolveSecret = async (
  value: string | { get: () => Promise<string> } | undefined,
) => {
  if (typeof value === "string") {
    return value;
  }

  if (isSecretsStoreBinding(value)) {
    try {
      return await value.get();
    } catch {
      return undefined;
    }
  }

  return undefined;
};

const runtimeSecretsCache = new WeakMap<Bindings, Promise<RuntimeSecrets>>();

const resolveRuntimeSecrets = (env: Bindings) => {
  const cached = runtimeSecretsCache.get(env);

  if (cached) {
    return cached;
  }

  const resolver = (async () => {
    const betterAuthSecret = await resolveSecret(env.BETTER_AUTH_SECRET);
    const resendApiKey = await resolveSecret(env.RESEND_API_KEY);
    const turnstileSecret = await resolveSecret(env.TURNSTILE_SECRET_KEY);
    const bootstrapAdminKey = await resolveSecret(env.BOOTSTRAP_ADMIN_KEY);

    const missingRequired: string[] = [];

    if (!betterAuthSecret) {
      missingRequired.push("BETTER_AUTH_SECRET");
    }

    if (missingRequired.length > 0) {
      throw new Error(`Faltan secretos requeridos: ${missingRequired.join(", ")}`);
    }

    return {
      betterAuthSecret,
      resendApiKey,
      turnstileSecret,
      bootstrapAdminKey,
    };
  })();

  runtimeSecretsCache.set(env, resolver);
  return resolver;
};

const verifyTurnstileToken = async (
  secret: string,
  token: string,
  remoteIp?: string,
) => {
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: remoteIp ?? "",
    }),
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json<{ success?: boolean }>();

  return Boolean(data.success);
};

const requireAuth: MiddlewareHandler<HonoConfig> = async (c, next) => {
  const auth = c.get("auth");
  const sessionData = await auth.api.getSession({ headers: c.req.raw.headers });
  const session = "data" in (sessionData as Record<string, unknown>)
    ? (sessionData as { data?: { session?: unknown, user?: unknown } | null }).data
    : (sessionData as { session?: unknown, user?: unknown } | null);

  if (!session?.session) {
    return c.json({ message: "No autorizado" }, 401);
  }

  c.set("session", session);

  await next();
};

const app = new Hono<HonoConfig>()
  .basePath("/api")
  .use(etag(), logger())
  .use('*', async (c, next) => {
    const allowedOrigin = c.env.DASHBOARD_ORIGIN ?? DEFAULT_DASHBOARD_ORIGIN;

    return cors({
      origin: (origin) => {
        if (allowedOrigin === '*' && origin) {
          return origin;
        }
        return allowedOrigin;
      },
      credentials: true,
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "X-Turnstile-Token", "x-turnstile-token", "X-Bootstrap-Key"],
      exposeHeaders: ["Content-Disposition", "Content-Type"],
    })(c, next);
  })
  .use('*', async (c, next) => {
    const db = drizzle(c.env.DB, { schema });
    const dashboardOrigin = c.env.DASHBOARD_ORIGIN ?? DEFAULT_DASHBOARD_ORIGIN;
    const requestOrigin = new URL(c.req.url).origin;
    let runtimeSecrets: RuntimeSecrets;

    try {
      runtimeSecrets = await resolveRuntimeSecrets(c.env);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Configuración de secretos inválida";
      return c.json({ message }, 503);
    }

    const auth = getAuth({
      d1: c.env.DB,
      secret: runtimeSecrets.betterAuthSecret,
      baseURL: resolveAuthBaseUrl(c.env.BETTER_AUTH_URL, c.req.url),
      resendApiKey: runtimeSecrets.resendApiKey,
      resendFromEmail: c.env.RESEND_FROM_EMAIL,
      trustedOrigins: [dashboardOrigin, requestOrigin],
    });

    c.set('db', db);
    c.set('auth', auth);
    c.set('runtimeSecrets', runtimeSecrets);

    await next();
  })
  .use('/auth/sign-in/email', async (c, next) => {
    if (c.req.method !== "POST") {
      await next();
      return;
    }

    const { turnstileSecret } = c.get("runtimeSecrets");

    if (!turnstileSecret) {
      await next();
      return;
    }

    const turnstileToken = c.req.header("X-Turnstile-Token");

    if (!turnstileToken) {
      return c.json({ message: "Captcha requerido" }, 400);
    }

    const isValid = await verifyTurnstileToken(
      turnstileSecret,
      turnstileToken,
      c.req.header("CF-Connecting-IP"),
    );

    if (!isValid) {
      return c.json({ message: "Captcha inválido" }, 400);
    }

    await next();
  })
  .use('/auth/sign-up/email', async (c, next) => {
    if (c.req.method !== "POST") {
      await next();
      return;
    }

    const db = c.get("db");
    const [result] = await db.select({ total: count() }).from(schema.user);

    if ((result?.total ?? 0) > 0) {
      return c.json({ message: "Registro público deshabilitado" }, 403);
    }

    const { bootstrapAdminKey: bootstrapKey } = c.get("runtimeSecrets");

    if (!bootstrapKey) {
      return c.json({ message: "Bootstrap no configurado" }, 503);
    }

    const requestBootstrapKey = c.req.header("X-Bootstrap-Key");

    if (!requestBootstrapKey || requestBootstrapKey !== bootstrapKey) {
      return c.json({ message: "Clave de bootstrap inválida" }, 401);
    }

    await next();
  })
  .on(["GET", "POST"], '/auth/*', async (c) => {
    const auth = c.get('auth');
    return auth.handler(c.req.raw);
  })
  .use('/houses/*', requireAuth)
  .use('/families/*', requireAuth)
  .use('/citizens/*', requireAuth)
  .use('/ai/*', requireAuth)
  .use('/polls/*', requireAuth)
  .use('/reports/*', requireAuth)
  .route('/houses', housesRouter)
  .route('/families', familiesRouter)
  .route('/citizens', citizensRouter)
  .route('/ai', aiRouter)
  .route('/polls', pollsRouter)
  .route('/reports', reportsRouter)
  .route('/seed', seedRouter);

export { ChatAgent }

const handler = {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    // 1. Manejar preflight (OPTIONS) para los agentes
    if (request.method === "OPTIONS") {
      const origin = request.headers.get("Origin");
      if (origin) {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Agent-Auth",
            "Access-Control-Allow-Credentials": "true",
          },
        });
      }
    }

    try {
      await resolveRuntimeSecrets(env);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Configuración de secretos inválida";
      return new Response(JSON.stringify({ message }), {
        status: 503,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // 2. Ruta de agentes
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) {
      // Si es una conexión WebSocket (101), la devolvemos intacta.
      // Envolverla en 'new Response' rompería el túnel del WebSocket.
      if (agentResponse.status === 101) {
        return agentResponse;
      }

      // Para peticiones HTTP (descarga de mensajes, etc.), añadimos CORS manualmente.
      const origin = request.headers.get("Origin") || "*";
      const response = new Response(agentResponse.body, agentResponse);
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      return response;
    }

    // 3. Ruta normal de Hono
    return app.fetch(request, env, ctx);
  }
};

export default handler

export type AppType = typeof app
