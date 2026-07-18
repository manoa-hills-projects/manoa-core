import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const tickets = sqliteTable(
  "tickets",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull().default("otro"),
    status: text("status").notNull().default("recibido"),
    submittedBy: text("submitted_by").notNull(),
    assignedTo: text("assigned_to"),
    resolutionNotes: text("resolution_notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (table) => [
    index("tickets_status_idx").on(table.status),
    index("tickets_submitted_idx").on(table.submittedBy),
  ]
);

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
