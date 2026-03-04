import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../database/schemas";
import { ac, admin as adminRole, superadmin, user as userRole } from "./permissions";

interface authConfig {
  d1: D1Database;
  secret: string;
  baseURL: string;
  resendApiKey?: string;
  resendFromEmail?: string;
  trustedOrigins?: string[];
}

export const getAuth = (config: authConfig) => {
  const { d1, secret, baseURL, resendApiKey, resendFromEmail, trustedOrigins } = config;

  const sendResetPasswordEmail = async (data: { user: { email?: string | null }; url: string }) => {
    if (!resendApiKey || !resendFromEmail || !data.user.email) {
      return;
    }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [data.user.email],
        subject: "Recuperación de contraseña - Manoa Core",
        html: `<p>Recibimos una solicitud para restablecer tu contraseña.</p><p><a href="${data.url}">Haz clic aquí para restablecerla</a></p><p>Si no fuiste tú, ignora este mensaje.</p>`,
      }),
    });
  };
  
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
      sendResetPassword: async ({ user, url }) => {
        await sendResetPasswordEmail({ user, url });
      },
      revokeSessionsOnPasswordReset: true,
    },
    secret: secret,
    baseURL: baseURL,
    trustedOrigins,
    plugins: [
      admin({
        ac,
        roles: {
          admin: adminRole,
          user: userRole,
          superadmin,
        },
      }),
    ],
  });
};