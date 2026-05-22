CREATE TABLE IF NOT EXISTS "app_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disease_catalog" (
	"slug" varchar(80) PRIMARY KEY NOT NULL,
	"label" varchar(80) NOT NULL,
	"common_name" varchar(120) NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"symptoms" text[] NOT NULL,
	"recommendations" text[] NOT NULL,
	"risk_level" varchar(20) NOT NULL,
	"accent_color" varchar(40) NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "manual_classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disease_slug" varchar(80) NOT NULL,
	"observation" text NOT NULL,
	"location" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "manual_classifications" ADD CONSTRAINT "manual_classifications_disease_slug_disease_catalog_slug_fk" FOREIGN KEY ("disease_slug") REFERENCES "public"."disease_catalog"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
INSERT INTO "disease_catalog" ("slug", "label", "common_name", "summary", "description", "symptoms", "recommendations", "risk_level", "accent_color", "display_order") VALUES
('bercak-daun', 'Bercak Daun', 'Gray Leaf Spot', 'Penyakit jamur yang menyebabkan bercak abu-abu pada daun jagung.', 'Bercak Daun adalah penyakit jamur yang disebabkan oleh Cercospora zeae-maydis. Penyakit ini ditandai dengan munculnya bercak berbentuk persegi panjang berwarna abu-abu dengan tepi coklat pada daun jagung. Penyakit ini berkembang pesat dalam kondisi lembab dan dapat mengurangi hasil panen secara signifikan.', ARRAY['Bercak berbentuk persegi panjang berwarna abu-abu','Tepi bercak berwarna coklat atau merah','Bercak biasanya muncul pada daun bagian bawah terlebih dahulu','Dalam kondisi lembab, bercak dapat berkembang dengan cepat'], ARRAY['Gunakan varietas jagung yang tahan terhadap penyakit ini','Terapkan rotasi tanaman dengan tanaman non-inang','Kurangi kelembaban dengan meningkatkan jarak tanam','Aplikasikan fungisida jika diperlukan','Buang sisa tanaman yang terinfeksi setelah panen'], 'high', '#9CA3AF', 1),
('hawar-daun', 'Hawar Daun', 'Northern/Southern Leaf Blight', 'Penyakit jamur yang menyebabkan hawar pada daun jagung dengan gejala bercak memanjang.', 'Hawar Daun adalah penyakit jamur yang disebabkan oleh Exserohilum turcicum (Northern Leaf Blight) atau Bipolaris maydis (Southern Leaf Blight). Penyakit ini ditandai dengan munculnya bercak memanjang berwarna coklat atau abu-abu pada daun jagung. Penyakit ini dapat menyebabkan kerusakan daun yang parah dan mengurangi hasil panen.', ARRAY['Bercak memanjang berwarna coklat atau abu-abu','Bercak dapat mencapai panjang 10-15 cm','Tepi bercak sering berwarna lebih gelap','Dalam kondisi lembab, bercak dapat berkembang dengan cepat','Daun dapat mati jika terinfeksi parah'], ARRAY['Gunakan varietas jagung yang tahan terhadap penyakit ini','Terapkan rotasi tanaman dengan tanaman non-inang','Kurangi kelembaban dengan meningkatkan jarak tanam','Aplikasikan fungisida jika diperlukan','Buang sisa tanaman yang terinfeksi setelah panen'], 'high', '#8B4513', 2),
('karat-daun', 'Karat Daun', 'Common Rust', 'Penyakit jamur yang menyebabkan pustula berwarna coklat kemerahan pada daun jagung.', 'Karat Daun adalah penyakit jamur yang disebabkan oleh Puccinia sorghi. Penyakit ini ditandai dengan munculnya pustula kecil berwarna coklat kemerahan pada permukaan daun jagung. Penyakit ini berkembang dalam kondisi lembab dan dapat mengurangi hasil panen jika tidak dikendalikan.', ARRAY['Pustula kecil berwarna coklat kemerahan pada permukaan daun','Pustula biasanya muncul pada daun bagian bawah terlebih dahulu','Dalam kondisi lembab, pustula dapat berkembang dengan cepat','Daun dapat menjadi kuning dan mati jika terinfeksi parah'], ARRAY['Gunakan varietas jagung yang tahan terhadap penyakit ini','Terapkan rotasi tanaman dengan tanaman non-inang','Kurangi kelembaban dengan meningkatkan jarak tanam','Aplikasikan fungisida jika diperlukan','Buang sisa tanaman yang terinfeksi setelah panen'], 'medium', '#DC2626', 3),
('daun-sehat', 'Daun Sehat', 'Healthy Leaf', 'Daun jagung yang sehat tanpa tanda-tanda penyakit atau kerusakan.', 'Daun Sehat menunjukkan kondisi daun jagung yang optimal tanpa adanya gejala penyakit jamur atau kerusakan lainnya. Daun yang sehat memiliki warna hijau cerah, tekstur normal, dan tidak menunjukkan bercak, pustula, atau tanda-tanda kerusakan lainnya.', ARRAY['Warna daun hijau cerah dan seragam','Tekstur daun normal dan tidak ada bercak','Tidak ada pustula atau tanda-tanda penyakit lainnya','Daun terlihat kuat dan tidak layu'], ARRAY['Pertahankan praktik budidaya yang baik','Lakukan monitoring rutin untuk mendeteksi penyakit sejak dini','Terapkan rotasi tanaman untuk menjaga kesehatan tanah','Berikan nutrisi yang cukup untuk pertumbuhan optimal','Jaga kelembaban tanah yang sesuai'], 'low', '#22C55E', 4)
ON CONFLICT ("slug") DO UPDATE SET
"label" = EXCLUDED."label",
"common_name" = EXCLUDED."common_name",
"summary" = EXCLUDED."summary",
"description" = EXCLUDED."description",
"symptoms" = EXCLUDED."symptoms",
"recommendations" = EXCLUDED."recommendations",
"risk_level" = EXCLUDED."risk_level",
"accent_color" = EXCLUDED."accent_color",
"display_order" = EXCLUDED."display_order",
"updated_at" = now();
