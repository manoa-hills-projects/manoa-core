import { DrizzleD1Database, drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as schema from "./shared/database/schemas"
import housesRouter from './modules/house/house.router'
import { logger } from 'hono/logger'
import { etag } from 'hono/etag'

type Bindings = {
  sigcc_manoa_db: D1Database
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

type Variables = {
  db: DrizzleD1Database<typeof schema>
}

export type HonoConfig = { Bindings: Bindings, Variables: Variables };

const app = new Hono<HonoConfig>()
  .use(etag(), logger())
  .use('*', cors())
  .use('*', async (c, next) => {
    const db = drizzle(c.env.sigcc_manoa_db, { schema });

    c.set('db', db);

    await next();
  })
  .route('/houses', housesRouter);

export default app

export type AppType = typeof app