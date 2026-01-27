import { DrizzleD1Database, drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as schema from "./shared/database/schemas"
import { getAuth } from './shared/utils/auth.util'

type Bindings = {
  sigcc_manoa_db: D1Database 
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

type Variables = {
  db: DrizzleD1Database<typeof schema>
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>().basePath("/api")
  .use('*', cors())
  .use('*', async (c, next) => {
    const db = drizzle(c.env.sigcc_manoa_db, { schema });
  
    c.set('db', db);
  
    await next();
  }).on(["POST", "GET"], "/api/auth/*", (c) => {
    const auth = getAuth({
      d1: c.env.sigcc_manoa_db,
      secret: c.env.BETTER_AUTH_SECRET,
      baseURL: c.env.BETTER_AUTH_URL
    });
  
    return auth.handler(c.req.raw);
  }).get('/', (c) => {
    return c.json({
      message: 'Hello Hono!'
    })
  })

export default app

export type AppType = typeof app