import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { baseColumns } from "./base.schema";

export const events = sqliteTable(
  "events",
  {
    ...baseColumns,
    title: text("title").notNull(),
    description: text("description"),
    date: text("date").notNull(),
    time: text("time"),
    duration: integer("duration"),
    location: text("location").default("online"),
    jitsiRoomName: text("jitsi_room_name"),
    status: text("status").notNull().default("scheduled"),
    createdBy: text("created_by"),
  },
  (table) => [
    index("events_status_idx").on(table.status),
    index("events_date_idx").on(table.date),
  ]
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
