import * as schema from "@/shared/database/schemas"
import { DrizzleD1Database } from "drizzle-orm/d1";

export class HouseHandler {
  async create(db: DrizzleD1Database<typeof schema>, data: typeof schema.houses.$inferInsert) {
    return await db.insert(schema.houses).values(data).returning();
  }
}