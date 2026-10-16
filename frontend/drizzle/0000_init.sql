CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "annotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"finding_type" varchar(50) NOT NULL,
	"finding_description" text NOT NULL,
	"severity" varchar(20),
	"location_on_image" varchar(255),
	"clinical_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"parent_id" integer,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_type" varchar(20) NOT NULL,
	"content_id" integer NOT NULL,
	"content_text" text NOT NULL,
	"embedding" vector(768) NOT NULL,
	"image_id" integer NOT NULL,
	"metadata_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"file_path" varchar(500) NOT NULL,
	"thumbnail_path" varchar(500),
	"modality" varchar(20) NOT NULL,
	"body_region" varchar(255) NOT NULL,
	"uploaded_by" integer NOT NULL,
	"is_anonymized" boolean DEFAULT false NOT NULL,
	"ai_analysis" text,
	"app_tag" varchar(50) DEFAULT 'healthlms' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"last_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"firebase_uid" varchar(128) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'supporter' NOT NULL,
	"specialization" varchar(255),
	"profession" varchar(255),
	"phone_number" varchar(50),
	"address" varchar(500),
	"supporter_comments" varchar(2000),
	"app_tag" varchar(50) DEFAULT 'healthlms' NOT NULL,
	"is_verified" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_image_id_medical_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."medical_images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_image_id_medical_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."medical_images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_image_id_medical_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."medical_images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_images" ADD CONSTRAINT "medical_images_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "annotations_image_id_idx" ON "annotations" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "annotations_finding_type_idx" ON "annotations" USING btree ("finding_type");--> statement-breakpoint
CREATE INDEX "comments_image_id_idx" ON "comments" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "comments_parent_id_idx" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "embeddings_content_idx" ON "embeddings" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "embeddings_embedding_idx" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "medical_images_modality_idx" ON "medical_images" USING btree ("modality");--> statement-breakpoint
CREATE INDEX "medical_images_body_region_idx" ON "medical_images" USING btree ("body_region");