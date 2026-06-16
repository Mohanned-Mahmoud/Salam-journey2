import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const funnelPageTable = pgTable("funnel_page", {
  id: uuid("id").primaryKey().defaultRandom(),
  blocks: jsonb("blocks").notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type FunnelPage = typeof funnelPageTable.$inferSelect;
