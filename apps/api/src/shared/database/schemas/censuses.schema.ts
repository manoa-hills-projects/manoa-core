
import { relations, sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { baseColumns } from "./base.schema";

export const houses = sqliteTable('houses', {
  ...baseColumns,
  address: text('address').notNull(),
  sector: text('sector').notNull(),
  number: text('number').notNull(),
  phone: text('phone'),
  type: text('type'),
  tenure: text('tenure'),
  latitude: real('latitude'),
  longitude: real('longitude'),
});

export const families = sqliteTable('families', {
  ...baseColumns,
  name: text('name').notNull().unique(),
  houseId: text('house_id').references(() => houses.id, { onDelete: 'set null' }),
  headId: text('head_id'),
  phone: text('phone'),
  observations: text('observations'),
});

export const citizens = sqliteTable('citizens', {
  ...baseColumns,
  dni: text('dni').notNull().unique(),
  dniType: text('dni_type').notNull().default('NATIONAL'),
  phone: text('phone'),
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

export const citizenDisabilities = sqliteTable('citizen_disabilities', {
  id: text('id').primaryKey(),
  citizenId: text('citizen_id').notNull().references(() => citizens.id, { onDelete: 'cascade' }),
  disabilityType: text('disability_type').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const citizensRelations = relations(citizens, ({ one, many }) => ({
  family: one(families, {
    fields: [citizens.familyId],
    references: [families.id],
  }),
  disabilities: many(citizenDisabilities),
}));

export const citizenDisabilitiesRelations = relations(citizenDisabilities, ({ one }) => ({
  citizen: one(citizens, {
    fields: [citizenDisabilities.citizenId],
    references: [citizens.id],
  }),
}));