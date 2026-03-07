import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";

export const baseColumns = {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date()),
};