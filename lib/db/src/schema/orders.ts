import { pgTable, uuid, varchar, text, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const paymentOrdersTable = pgTable("payment_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }),
  itemType: varchar("item_type", { length: 50 }).notNull(), // 'product' | 'course' | 'booking'
  itemId: varchar("item_id", { length: 100 }).notNull(),
  itemTitle: varchar("item_title", { length: 255 }).notNull(),
  amountUsd: numeric("amount_usd", { precision: 10, scale: 2 }).notNull(),
  amountEgp: numeric("amount_egp", { precision: 10, scale: 2 }).notNull(),
  exchangeRate: numeric("exchange_rate", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).default("instapay").notNull(),
  status: varchar("status", { length: 50 }).default("pending_verification").notNull(), // 'pending_verification' | 'approved' | 'rejected' | 'cancelled'
  adminNotes: text("admin_notes"),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by", { length: 255 }),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PaymentOrder = typeof paymentOrdersTable.$inferSelect;
export type InsertPaymentOrder = typeof paymentOrdersTable.$inferInsert;
