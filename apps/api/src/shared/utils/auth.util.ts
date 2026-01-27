import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../database/schemas";

interface authConfig {
  d1: D1Database;
  secret: string;
  baseURL: string;
}

export const getAuth = (config: authConfig) => {
  const { d1, secret, baseURL } = config;
  
  return betterAuth({
    database: drizzleAdapter(
      drizzle(d1, { schema }),
      {
        provider: "sqlite",
        schema: schema,
      }
    ),
    emailAndPassword: {
      enabled: true,
    },
    secret: secret,
    baseURL: baseURL,
  });
};