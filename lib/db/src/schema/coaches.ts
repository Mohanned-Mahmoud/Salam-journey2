import { pgTable, text, varchar, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const coachesTable = pgTable("coaches", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCoachSchema = createInsertSchema(coachesTable).omit({ id: true, createdAt: true });
export type Coach = typeof coachesTable.$inferSelect;
export type InsertCoach = Omit<Coach, "id" | "createdAt">;
