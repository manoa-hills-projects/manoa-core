
import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const houses = sqliteTable('houses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  address: text('address').notNull(),
  sector: text('sector').notNull(),
  number: text('number').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
});

export const families = sqliteTable('families', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  houseId: text('house_id').references(() => houses.id, { onDelete: 'set null' }),
  headId: text('head_id')
});

export const citizens = sqliteTable('citizens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  dni: text('dni').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  birthDate: text('birth_date').notNull(),
  gender: text('gender').notNull(),
  isHeadOfHousehold: integer('is_head_of_household', { mode: 'boolean' }).default(false),
  familyId: text('family_id').references(() => families.id, { onDelete: 'set null' }),
  userId: text('user_id'),
});

export const familiesRelations = relations(families, ({ one, many }) => ({
  house: one(houses, {
    fields: [families.houseId],
    references: [houses.id],
  }),
  head: one(citizens, {
    fields: [families.headId],
    references: [citizens.id],
  }),
  citizens: many(citizens),
}));

export const citizensRelations = relations(citizens, ({ one }) => ({
  family: one(families, {
    fields: [citizens.familyId],
    references: [families.id],
  }),
}));