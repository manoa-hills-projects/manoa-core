import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), 
});

export const modules = sqliteTable('modules', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique()
});

export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique()
});

export const rolePermissions = sqliteTable('role_permissions', {
  id: text('id').primaryKey(),
  roleId: text('role_id').references(() => roles.id),
  moduleId: text('module_id').references(() => modules.id),
  permissionId: text('permission_id').references(() => permissions.id),
});