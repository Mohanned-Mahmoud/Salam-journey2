import { pgTable, varchar, text, integer, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const testimonialStatusEnum = pgEnum("testimonial_status", ["active", "hidden"]);

export const testimonialsTable = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameAr: varchar("name_ar", { length: 255 }),
  nameEn: varchar("name_en", { length: 255 }),
  roleAr: varchar("role_ar", { length: 255 }),
  roleEn: varchar("role_en", { length: 255 }),
  quoteAr: text("quote_ar").notNull(),
  quoteEn: text("quote_en"),
  rating: integer("rating"),
  status: testimonialStatusEnum("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTestimonialSchema = createInsertSchema(testimonialsTable).omit({ id: true, createdAt: true });
export type Testimonial = typeof testimonialsTable.$inferSelect;
export type InsertTestimonial = Omit<Testimonial, "id" | "createdAt">;
