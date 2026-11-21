import { pgTable, varchar, text, integer, numeric, timestamp, uuid, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { coachesTable } from "./coaches";

export const courseCategoryEnum = pgEnum("course_category", ["course", "workshop", "free"]);
export const courseStatusEnum = pgEnum("course_status", ["active", "hidden"]);

export interface CourseLesson {
  id: string;
  titleAr: string;
  titleEn?: string;
  duration?: string;
  videoUrl: string;
  descriptionAr?: string;
  descriptionEn?: string;
  isFreePreview?: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
}

export const coursesTable = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  coachId: uuid("coach_id")
    .notNull()
    .references(() => coachesTable.id, { onDelete: "cascade" }),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  descAr: text("desc_ar"),
  descEn: text("desc_en"),
  detailsAr: text("details_ar"),
  detailsEn: text("details_en"),
  category: courseCategoryEnum("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }),
  duration: integer("duration"),
  durationUnit: varchar("duration_unit", { length: 50 }),
  students: varchar("students", { length: 50 }),
  imageUrl: varchar("image_url", { length: 1024 }),
  images: jsonb("images").$type<string[]>().default([]),
  videoUrl: varchar("video_url", { length: 1024 }),
  lessons: jsonb("lessons").$type<CourseLesson[]>().default([]),
  featuresAr: jsonb("features_ar").$type<string[]>().default([]),
  featuresEn: jsonb("features_en").$type<string[]>().default([]),
  badgeAr: varchar("badge_ar", { length: 100 }),
  badgeEn: varchar("badge_en", { length: 100 }),
  status: courseStatusEnum("status").default("active"),
  gradient: varchar("gradient", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true, createdAt: true });
export type Course = typeof coursesTable.$inferSelect;
export type InsertCourse = Omit<Course, "id" | "createdAt">;
