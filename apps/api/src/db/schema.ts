import { pgTable, timestamp, uuid, varchar, text, integer, jsonb, real } from 'drizzle-orm/pg-core';

export const appEvents = pgTable('app_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 120 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const diseaseCatalog = pgTable('disease_catalog', {
  slug: varchar('slug', { length: 80 }).primaryKey(),
  label: varchar('label', { length: 80 }).notNull(),
  commonName: varchar('common_name', { length: 120 }).notNull(),
  summary: text('summary').notNull(),
  description: text('description').notNull(),
  symptoms: text('symptoms').array().notNull(),
  recommendations: text('recommendations').array().notNull(),
  riskLevel: varchar('risk_level', { length: 20 }).notNull(),
  accentColor: varchar('accent_color', { length: 40 }).notNull(),
  displayOrder: integer('display_order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const manualClassifications = pgTable('manual_classifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  diseaseSlug: varchar('disease_slug', { length: 80 })
    .notNull()
    .references(() => diseaseCatalog.slug),
  observation: text('observation').notNull(),
  location: varchar('location', { length: 160 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const imageClassifications = pgTable('image_classifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  predictedDiseaseSlug: varchar('predicted_disease_slug', { length: 80 })
    .notNull()
    .references(() => diseaseCatalog.slug),
  confidence: real('confidence').notNull(),
  probabilities: jsonb('probabilities').notNull(),
  imageUrl: text('image_url').notNull(),
  originalFileName: varchar('original_file_name', { length: 240 }).notNull(),
  uploaderPublicId: varchar('uploader_public_id', { length: 160 }).notNull(),
  uploaderPayload: jsonb('uploader_payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
