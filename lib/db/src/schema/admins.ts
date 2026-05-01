import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const adminsTable = pgTable("admins", {
  id:           uuid("id").primaryKey().defaultRandom(),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

export const adminSessionsTable = pgTable("admin_sessions", {
  id:        uuid("id").primaryKey().defaultRandom(),
  token:     text("token").notNull().unique(),
  adminId:   uuid("admin_id").notNull().references(() => adminsTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Admin        = typeof adminsTable.$inferSelect;
export type AdminSession = typeof adminSessionsTable.$inferSelect;
