/**
 * Configuración de Better Auth
 *
 * Configura la instancia de Better Auth con los plugins necesarios
 * y el hook que asigna automáticamente el perfil "citizen" a nuevos
 * usuarios registrados.
 *
 * @module utils/auth.util
 *
 * @note
 * La asignación automática de perfil "citizen" se realiza vía
 * databaseHooks.user.create.after. El enlace con el censo (buscar
 * ciudadano por DNI/email y setear citizens.userId) queda pendiente
 * hasta que el formulario de sign-up incluya un campo DNI.
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../database/schemas";
import { SYSTEM_PROFILES } from "../constants/profiles";
import { ac, admin as adminRole, superadmin, user as userRole } from "./permissions";

interface authConfig {
  d1: D1Database;
  secret: string;
  baseURL: string;
  resendApiKey?: string;
  resendFromEmail?: string;
  trustedOrigins?: string[];
}

/**
 * Asigna el perfil "citizen" a un usuario recién creado.
 *
 * Busca el perfil citizen en la BD y crea la relación en user_profiles.
 * Es idempotente: si ya existe la relación, no la duplica.
 */
async function assignCitizenProfile(
  db: ReturnType<typeof drizzle<typeof schema>>,
  userId: string
): Promise<void> {
  const citizenProfile = await db
    .select({ id: schema.profiles.id })
    .from(schema.profiles)
    .where(eq(schema.profiles.key, SYSTEM_PROFILES.CITIZEN))
    .get();

  if (!citizenProfile) {
    console.error("[auth] No se encontró el perfil citizen. Ejecutar seed-rbac.");
    return;
  }

  const existing = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId))
    .get();

  if (existing) {
    return;
  }

  await db.insert(schema.userProfiles).values({
    userId,
    profileId: citizenProfile.id,
  });
}

export const getAuth = (config: authConfig) => {
  const { d1, secret, baseURL, resendApiKey, resendFromEmail, trustedOrigins } = config;

  const db = drizzle(d1, { schema });

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
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema,
    }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        await sendResetPasswordEmail({ user, url });
      },
      revokeSessionsOnPasswordReset: true,
    },
    advanced: {
      useSecureCookies: true,
      cookiePrefix: "manoa_auth",
      crossSubDomainCookies: {
        enabled: true,
      },
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
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
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            try {
              await assignCitizenProfile(db, user.id);
            } catch (error) {
              console.error("[auth] Error asignando perfil citizen:", error);
            }
          },
        },
      },
    },
  });
};
