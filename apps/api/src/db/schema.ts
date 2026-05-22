import {
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

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

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 240 }).notNull(),
  name: varchar('name', { length: 160 }).notNull(),
  passwordHash: text('password_hash'),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  googleId: varchar('google_id', { length: 240 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  googleIdx: uniqueIndex('users_google_id_idx').on(table.googleId),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tokenIdx: uniqueIndex('sessions_token_hash_idx').on(table.tokenHash),
  userIdx: index('sessions_user_id_idx').on(table.userId),
}));

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

export const diagnoses = pgTable('diagnoses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  predictedDiseaseSlug: varchar('predicted_disease_slug', { length: 80 }).references(() => diseaseCatalog.slug),
  confidence: real('confidence'),
  status: varchar('status', { length: 40 }).notNull(),
  failureReason: text('failure_reason'),
  imageUrl: text('image_url').notNull(),
  uploaderPublicId: varchar('uploader_public_id', { length: 160 }).notNull(),
  imageFileName: varchar('image_file_name', { length: 240 }).notNull(),
  imageMimeType: varchar('image_mime_type', { length: 120 }).notNull(),
  imageSizeBytes: integer('image_size_bytes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('diagnoses_user_id_idx').on(table.userId),
  statusIdx: index('diagnoses_status_idx').on(table.status),
}));

export const diagnosisPredictions = pgTable('diagnosis_predictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  diagnosisId: uuid('diagnosis_id').notNull().references(() => diagnoses.id),
  diseaseSlug: varchar('disease_slug', { length: 80 }).references(() => diseaseCatalog.slug),
  modelLabel: varchar('model_label', { length: 120 }).notNull(),
  confidence: real('confidence').notNull(),
  rank: integer('rank').notNull(),
}, (table) => ({
  diagnosisIdx: index('diagnosis_predictions_diagnosis_id_idx').on(table.diagnosisId),
}));

export const expertReviews = pgTable('expert_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  diagnosisId: uuid('diagnosis_id').notNull().references(() => diagnoses.id),
  expertId: uuid('expert_id').notNull().references(() => users.id),
  verdict: varchar('verdict', { length: 20 }).notNull(),
  correctedDiseaseSlug: varchar('corrected_disease_slug', { length: 80 }).references(() => diseaseCatalog.slug),
  notes: text('notes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  diagnosisIdx: index('expert_reviews_diagnosis_id_idx').on(table.diagnosisId),
  expertIdx: index('expert_reviews_expert_id_idx').on(table.expertId),
}));
