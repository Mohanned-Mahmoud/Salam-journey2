import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const aiKnowledgeTable = pgTable("ai_knowledge", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }), // 🌟 مضافة لتطابق الـ SQL Schema تماماً
  createdAt: timestamp("created_at").defaultNow().notNull(), // 🌟 مضافة لتطابق الـ SQL Schema تماماً
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAiKnowledgeSchema = createInsertSchema(aiKnowledgeTable).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type AiKnowledge = typeof aiKnowledgeTable.$inferSelect;
export type InsertAiKnowledge = Omit<AiKnowledge, "id" | "createdAt" | "updatedAt">;