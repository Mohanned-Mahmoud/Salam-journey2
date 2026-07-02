import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

// الجدول الرئيسي بعد تعديله ليدعم صفحات متعددة
export const funnelPageTable = pgTable("funnel_page", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().default("الصفحة التسويقية"), // اسم الصفحة للتمييز في الأدمن
  slug: text("slug").notNull().unique().default("main"), // رابط الصفحة (مثلاً: main أو register)
  blocks: jsonb("blocks").notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// الجدول الجديد لتسجيل بيانات العملاء (Leads) من الفورم
export const funnelRegistrationsTable = pgTable("funnel_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id").references(() => funnelPageTable.id).notNull(), // مربوط بالصفحة اللي سجل منها
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FunnelPage = typeof funnelPageTable.$inferSelect;
export type FunnelRegistration = typeof funnelRegistrationsTable.$inferSelect;