/**
 * Seed de Super Admin
 *
 * Crea un usuario super administrador con:
 * - role: 'superadmin' (legacy)
 * - perfil: 'super_admin' (RBAC)
 *
 * @module seeds/admin
 */

import { eq } from "drizzle-orm";
import { hash } from "bcrypt";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../schemas";
import { SYSTEM_PROFILES } from "../../constants/profiles";

type Database = DrizzleD1Database<typeof schema>;

/**
 * Opciones para crear el super admin
 */
export interface CreateAdminOptions {
  email: string;
  password: string;
  name?: string;
}

/**
 * Resultado del seed de admin
 */
export interface AdminSeedResult {
  userId: string;
  email: string;
  name: string;
  profileAssigned: boolean;
}

/**
 * Crea un super administrador
 * 
 * @param db - Instancia de la base de datos
 * @param options - Opciones del admin (email, password, name)
 * @returns Resultado con el ID del usuario creado
 */
export async function seedAdmin(
  db: Database,
  options: CreateAdminOptions
): Promise<AdminSeedResult> {
  const { email, password, name = "Administrador" } = options;
  const emailLower = email.trim().toLowerCase();

  console.log(`\n👤 Seed Admin: Creando super admin...`);
  console.log(`   Email: ${emailLower}`);
  console.log(`   Nombre: ${name}`);

  // 1. Verificar si el usuario ya existe
  const existingUser = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, emailLower))
    .get();

  if (existingUser) {
    console.log(`   ⏭️  El usuario ${emailLower} ya existe`);
    
    // Verificar si tiene perfil asignado
    const existingProfile = await db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, existingUser.id))
      .get();

    if (existingProfile) {
      console.log(`   ✅ Ya tiene perfil RBAC asignado`);
      return {
        userId: existingUser.id,
        email: emailLower,
        name: existingUser.name,
        profileAssigned: true,
      };
    }

    // Asignar perfil si no lo tiene
    const profileAssigned = await assignSuperAdminProfile(db, existingUser.id);
    
    return {
      userId: existingUser.id,
      email: emailLower,
      name: existingUser.name,
      profileAssigned,
    };
  }

  // 2. Crear usuario
  const userId = crypto.randomUUID();
  const now = new Date();
  const hashedPassword = await hash(password, 10);

  await db.insert(schema.user).values({
    id: userId,
    email: emailLower,
    name: name.trim(),
    role: "superadmin",
    emailVerified: true,
    banned: false,
    createdAt: now,
    updatedAt: now,
  }).run();

  console.log(`   ✅ Usuario creado con role: superadmin`);

  // 3. Crear account con password hash (para better-auth)
  const accountId = crypto.randomUUID();
  await db.insert(schema.account).values({
    id: accountId,
    accountId: emailLower,
    providerId: "credential",
    userId,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  }).run();

  console.log(`   ✅ Contraseña configurada`);

  // 4. Asignar perfil super_admin
  const profileAssigned = await assignSuperAdminProfile(db, userId);

  console.log(`   ✅ Super admin creado exitosamente`);

  return {
    userId,
    email: emailLower,
    name: name.trim(),
    profileAssigned,
  };
}

/**
 * Asigna el perfil super_admin a un usuario
 */
async function assignSuperAdminProfile(db: Database, userId: string): Promise<boolean> {
  // Buscar perfil super_admin
  const superAdminProfile = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.key, SYSTEM_PROFILES.SUPER_ADMIN))
    .get();

  if (!superAdminProfile) {
    console.log(`   ⚠️  Perfil 'super_admin' no encontrado. Ejecuta primero: npm run db:seed -- --only rbac`);
    return false;
  }

  // Verificar si ya tiene perfil
  const existingProfile = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId))
    .get();

  if (existingProfile) {
    console.log(`   ⏭️  El usuario ya tiene un perfil asignado`);
    return true;
  }

  // Asignar perfil
  await db.insert(schema.userProfiles).values({
    userId,
    profileId: superAdminProfile.id,
  });

  console.log(`   ✅ Perfil 'super_admin' asignado`);
  return true;
}
