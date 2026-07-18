import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const acts = sqliteTable(
  "acts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    bookType: text("book_type").notNull().default("asamblea_ciudadanos"),
    folioNumber: integer("folio_number").notNull(),
    fecha: text("fecha").notNull(),
    hora: text("hora"),
    lugar: text("lugar"),
    tipo: text("tipo").notNull().default("ordinaria"),
    quorum: integer("quorum").default(0),
    contenido: text("contenido").notNull(),
    vocerosPresentes: text("voceros_presentes"),
    acuerdos: text("acuerdos"),
    pdfUrl: text("pdf_url"),
    isPublished: integer("is_published", { mode: "boolean" }).default(false).notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (table) => [
    uniqueIndex("acts_book_folio_idx").on(table.bookType, table.folioNumber),
  ]
);

export type Act = typeof acts.$inferSelect;
export type NewAct = typeof acts.$inferInsert;
