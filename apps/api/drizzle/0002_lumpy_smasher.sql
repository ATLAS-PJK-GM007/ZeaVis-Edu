CREATE TABLE IF NOT EXISTS "diagnoses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"predicted_disease_slug" varchar(80),
	"confidence" real,
	"status" varchar(40) NOT NULL,
	"failure_reason" text,
	"image_url" text NOT NULL,
	"uploader_public_id" varchar(160) NOT NULL,
	"image_file_name" varchar(240) NOT NULL,
	"image_mime_type" varchar(120) NOT NULL,
	"image_size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "diagnosis_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagnosis_id" uuid NOT NULL,
	"disease_slug" varchar(80),
	"model_label" varchar(120) NOT NULL,
	"confidence" real NOT NULL,
	"rank" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expert_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagnosis_id" uuid NOT NULL,
	"expert_id" uuid NOT NULL,
	"verdict" varchar(20) NOT NULL,
	"corrected_disease_slug" varchar(80),
	"notes" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(240) NOT NULL,
	"name" varchar(160) NOT NULL,
	"password_hash" text,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"google_id" varchar(240),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_predicted_disease_slug_disease_catalog_slug_fk" FOREIGN KEY ("predicted_disease_slug") REFERENCES "public"."disease_catalog"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "diagnosis_predictions" ADD CONSTRAINT "diagnosis_predictions_diagnosis_id_diagnoses_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."diagnoses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "diagnosis_predictions" ADD CONSTRAINT "diagnosis_predictions_disease_slug_disease_catalog_slug_fk" FOREIGN KEY ("disease_slug") REFERENCES "public"."disease_catalog"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expert_reviews" ADD CONSTRAINT "expert_reviews_diagnosis_id_diagnoses_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."diagnoses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expert_reviews" ADD CONSTRAINT "expert_reviews_expert_id_users_id_fk" FOREIGN KEY ("expert_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expert_reviews" ADD CONSTRAINT "expert_reviews_corrected_disease_slug_disease_catalog_slug_fk" FOREIGN KEY ("corrected_disease_slug") REFERENCES "public"."disease_catalog"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "diagnoses_user_id_idx" ON "diagnoses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "diagnoses_status_idx" ON "diagnoses" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "diagnosis_predictions_diagnosis_id_idx" ON "diagnosis_predictions" USING btree ("diagnosis_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expert_reviews_diagnosis_id_idx" ON "expert_reviews" USING btree ("diagnosis_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expert_reviews_expert_id_idx" ON "expert_reviews" USING btree ("expert_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_hash_idx" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_google_id_idx" ON "users" USING btree ("google_id");