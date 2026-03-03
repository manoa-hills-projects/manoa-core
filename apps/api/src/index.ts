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
import aiRouter from './modules/ai/ai.router'
import { logger } from 'hono/logger'
import { etag } from 'hono/etag'
import { getAuth } from './shared/utils/auth.util'

type Bindings = {
  sigcc_manoa_db: D1Database
  AI?: {
    run: (model: string, input: any) => Promise<any>
  }
  AI_MODEL?: string
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  DASHBOARD_ORIGIN?: string;
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  BOOTSTRAP_ADMIN_KEY?: string;
}

type Variables = {
  db: DrizzleD1Database<typeof schema>
  auth: ReturnType<typeof getAuth>
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
    ? (sessionData as { data?: { session?: unknown } | null }).data
    : (sessionData as { session?: unknown } | null);

  if (!session?.session) {
    return c.json({ message: "No autorizado" }, 401);
  }

  await next();
};

const app = new Hono<HonoConfig>()
  .basePath("/api")
  .use(etag(), logger())
  .use('*', async (c, next) => {
    const allowedOrigin = c.env.DASHBOARD_ORIGIN ?? DEFAULT_DASHBOARD_ORIGIN;

    return cors({
      origin: allowedOrigin,
      credentials: true,
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "X-Turnstile-Token", "X-Bootstrap-Key"],
    })(c, next);
  })
  .use('*', async (c, next) => {
    const db = drizzle(c.env.sigcc_manoa_db, { schema });
    const dashboardOrigin = c.env.DASHBOARD_ORIGIN ?? DEFAULT_DASHBOARD_ORIGIN;
    const requestOrigin = new URL(c.req.url).origin;
    const auth = getAuth({
      d1: c.env.sigcc_manoa_db,
      secret: c.env.BETTER_AUTH_SECRET,
      baseURL: resolveAuthBaseUrl(c.env.BETTER_AUTH_URL, c.req.url),
      resendApiKey: c.env.RESEND_API_KEY,
      resendFromEmail: c.env.RESEND_FROM_EMAIL,
      trustedOrigins: [dashboardOrigin, requestOrigin],
    });

    c.set('db', db);
    c.set('auth', auth);

    await next();
  })
  .use('/auth/sign-in/email', async (c, next) => {
    if (c.req.method !== "POST") {
      await next();
      return;
    }

    if (!c.env.TURNSTILE_SECRET_KEY) {
      await next();
      return;
    }

    const turnstileToken = c.req.header("X-Turnstile-Token");

    if (!turnstileToken) {
      return c.json({ message: "Captcha requerido" }, 400);
    }

    const isValid = await verifyTurnstileToken(
      c.env.TURNSTILE_SECRET_KEY,
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

    const bootstrapKey = c.env.BOOTSTRAP_ADMIN_KEY;

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
  .route('/houses', housesRouter)
  .route('/families', familiesRouter)
  .route('/citizens', citizensRouter)
  .route('/ai', aiRouter);

export default app

export type AppType = typeof app
