/**
 * Modules Schema
 *
 * Define los módulos del sistema (fuente de verdad).
 * Cada módulo tiene metadata para renderizar el sidebar y el editor de perfiles.
 *
 * @module modules
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const modules = sqliteTable("modules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Identificador único del módulo (ej: "houses", "treasury") */
  key: text("key").notNull().unique(),
  /** Nombre visible (ej: "Viviendas") */
  name: text("name").notNull(),
  /** Descripción del módulo */
  description: text("description"),
  /** Ruta del frontend (ej: "/houses") */
  route: text("route"),
  /** Nombre del icono (ej: "Home", "Users") */
  icon: text("icon"),
  /** Clave del grupo al que pertenece (ej: "census") */
  groupKey: text("group_key").notNull().default("other"),
  /** Etiqueta visible del grupo (ej: "Censo") */
  groupLabel: text("group_label").notNull().default("Otros"),
  /** Orden de aparición */
  sortOrder: integer("sort_order").notNull().default(0),
  /** Si está activo */
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export type Module = typeof modules.$inferSelect;
