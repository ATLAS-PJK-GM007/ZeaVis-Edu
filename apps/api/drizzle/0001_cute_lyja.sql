CREATE TABLE IF NOT EXISTS "image_classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"predicted_disease_slug" varchar(80) NOT NULL,
	"confidence" real NOT NULL,
	"probabilities" jsonb NOT NULL,
	"image_url" text NOT NULL,
	"original_file_name" varchar(240) NOT NULL,
	"uploader_public_id" varchar(160) NOT NULL,
	"uploader_payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "image_classifications" ADD CONSTRAINT "image_classifications_predicted_disease_slug_disease_catalog_slug_fk" FOREIGN KEY ("predicted_disease_slug") REFERENCES "public"."disease_catalog"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
