import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  // driver: 'd1-http',
  schema: './src/shared/database/schemas',
  out: './src/shared/database/migrations',
  dbCredentials: {
    databaseId: 'dbdb463f-3b0c-4ed6-baea-7f91a5ba8d75',
    url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/074d0ceee28b28ea1610671e566e6b23422c910f5a596b9792edb20e3dac4013.sqlite',
  },
});