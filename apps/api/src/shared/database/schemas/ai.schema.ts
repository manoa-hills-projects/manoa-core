import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { baseColumns } from "./base.schema";
import { user } from "./auth.schema";

export const conversations = sqliteTable("conversations", {
    ...baseColumns,
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    title: text("title"),
});

export const messages = sqliteTable("messages", {
    ...baseColumns,
    conversationId: text("conversation_id")
        .notNull()
        .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    content: text("content").notNull(),
});

export const conversationsRelations = relations(
    conversations,
    ({ one, many }) => ({
        user: one(user, {
            fields: [conversations.userId],
            references: [user.id],
        }),
        messages: many(messages),
    })
);

export const messagesRelations = relations(messages, ({ one }) => ({
    conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id],
    }),
}));
