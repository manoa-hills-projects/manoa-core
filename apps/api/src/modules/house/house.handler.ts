import * as schema from "@/shared/database/schemas"
import { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";

export class HouseHandler {
  async create(db: DrizzleD1Database<typeof schema>, data: typeof schema.houses.$inferInsert) {
    return await db.insert(schema.houses).values(data).returning();
  }
  
  async findOne(db: DrizzleD1Database<typeof schema>, id: string) {
    return await db.select().from(schema.houses).where(eq(schema.houses.id, id)).limit(1).get();
  }
}