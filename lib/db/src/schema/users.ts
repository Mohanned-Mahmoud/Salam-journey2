import { pgTable, text, varchar, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  passwordHash: text("password_hash"),
  
  // 🌟 ضفنا العمود هنا بالظبط عشان Drizzle يربطه مع الـ SQL اللي عملناه في Neon
  role: text("role").default("user"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// الـ Zod schema والـ Types هتتحدث أوتوماتيكياً وتلقط الـ role الجديد
export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type User = typeof usersTable.$inferSelect;
export type InsertUser = Omit<User, "id" | "createdAt">;