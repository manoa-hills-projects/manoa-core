import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const homes = sqliteTable('homes', {
  id: text('id').primaryKey(),
  address: text('address').notNull(),
  sector: text('sector').notNull(),
  houseNumber: text('house_number').notNull(),
});

export const families = sqliteTable('families', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  homeId: text('home_id').references(() => homes.id)
});

export const citizens = sqliteTable('citizens', {
  id: text('id').primaryKey(),
  dni: text('dni').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  birthDate: text('birth_date').notNull(),
  gender: text('gender').notNull(),
  isHeadOfHousehold: integer('is_head_of_household', { mode: 'boolean' }).default(false),
  familyId: text('family_id').references(() => families.id)
});