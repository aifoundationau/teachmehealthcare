/**
 * Database tables. Column names and limits follow data-contracts.md.
 * After changing this file, run `npm run db:generate` to create a migration.
 */

import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  vector,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { APP_TAG } from "../env";

export const EMBEDDING_DIMENSIONS = 768;

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date());
const appTag = () => varchar("app_tag", { length: 50 }).notNull().default(APP_TAG);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firebaseUid: varchar("firebase_uid", { length: 128 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("supporter"),
  specialization: varchar("specialization", { length: 255 }),
  profession: varchar("profession", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  address: varchar("address", { length: 500 }),
  supporterComments: varchar("supporter_comments", { length: 2000 }),
  appTag: appTag(),
  isVerified: boolean("is_verified").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const medicalImages = pgTable(
  "medical_images",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    filePath: varchar("file_path", { length: 500 }).notNull(),
    thumbnailPath: varchar("thumbnail_path", { length: 500 }),
    modality: varchar("modality", { length: 20 }).notNull(),
    bodyRegion: varchar("body_region", { length: 255 }).notNull(),
    uploadedBy: integer("uploaded_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isAnonymized: boolean("is_anonymized").notNull().default(false),
    aiAnalysis: text("ai_analysis"),
    appTag: appTag(),
    createdAt: createdAt(),
  },
  (t) => [
    index("medical_images_modality_idx").on(t.modality),
    index("medical_images_body_region_idx").on(t.bodyRegion),
  ],
);

export const annotations = pgTable(
  "annotations",
  {
    id: serial("id").primaryKey(),
    imageId: integer("image_id")
      .notNull()
      .references(() => medicalImages.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    findingType: varchar("finding_type", { length: 50 }).notNull(),
    findingDescription: text("finding_description").notNull(),
    severity: varchar("severity", { length: 20 }),
    locationOnImage: varchar("location_on_image", { length: 255 }),
    clinicalNotes: text("clinical_notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("annotations_image_id_idx").on(t.imageId),
    index("annotations_finding_type_idx").on(t.findingType),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    imageId: integer("image_id")
      .notNull()
      .references(() => medicalImages.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: integer("parent_id").references((): AnyPgColumn => comments.id, {
      onDelete: "cascade",
    }),
    content: text("content").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("comments_image_id_idx").on(t.imageId),
    index("comments_parent_id_idx").on(t.parentId),
  ],
);

export const embeddings = pgTable(
  "embeddings",
  {
    id: serial("id").primaryKey(),
    contentType: varchar("content_type", { length: 20 }).notNull(),
    contentId: integer("content_id").notNull(),
    contentText: text("content_text").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    imageId: integer("image_id")
      .notNull()
      .references(() => medicalImages.id, { onDelete: "cascade" }),
    metadata: jsonb("metadata_json").$type<Record<string, string>>(),
    createdAt: createdAt(),
  },
  (t) => [
    index("embeddings_content_idx").on(t.contentType, t.contentId),
    index("embeddings_embedding_idx").using("hnsw", t.embedding.op("vector_cosine_ops")),
  ],
);

/** Last-request time per caller for rate-limited endpoints, shared across serverless instances. */
export const rateLimits = pgTable("rate_limits", {
  key: varchar("key", { length: 255 }).primaryKey(),
  lastAt: timestamp("last_at", { withTimezone: true }).notNull(),
});

export type User = typeof users.$inferSelect;
export type MedicalImage = typeof medicalImages.$inferSelect;
export type Annotation = typeof annotations.$inferSelect;
export type Comment = typeof comments.$inferSelect;
