import * as schema from "@/shared/database/schemas";
import { eq, and } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

export const getConversations = async (
    db: DrizzleD1Database<typeof schema>,
    userId: string,
) => {
    const result = await db
        .select()
        .from(schema.conversations)
        .where(eq(schema.conversations.userId, userId))
        .orderBy(schema.conversations.createdAt);
    return { data: result };
};

export const getMessages = async (
    db: DrizzleD1Database<typeof schema>,
    conversationId: string,
) => {
    const result = await db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, conversationId))
        .orderBy(schema.messages.createdAt);
    return { data: result };
};

export const createConversation = async (
    db: DrizzleD1Database<typeof schema>,
    userId: string,
    title?: string,
) => {
    const id = crypto.randomUUID();
    const [result] = await db
        .insert(schema.conversations)
        .values({ id, userId, title: title ?? "Nueva conversación" })
        .returning();
    return { data: result };
};

export const deleteConversation = async (
    db: DrizzleD1Database<typeof schema>,
    conversationId: string,
    userId: string,
) => {
    await db
        .delete(schema.conversations)
        .where(
            and(
                eq(schema.conversations.id, conversationId),
                eq(schema.conversations.userId, userId),
            )
        );
    return { success: true };
};
