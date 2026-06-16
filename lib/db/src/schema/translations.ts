import { pgTable, varchar, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const translationsTable = pgTable("translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  textHash: varchar("text_hash", { length: 64 }).notNull().unique(),
  sourceText: text("source_text").notNull(),
  translatedText: text("translated_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Translation = typeof translationsTable.$inferSelect;
