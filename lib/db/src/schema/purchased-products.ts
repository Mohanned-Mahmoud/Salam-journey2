import { pgTable, uuid, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const purchasedProductsTable = pgTable("purchased_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => productsTable.id, { onDelete: "cascade" }).notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  paymentId: varchar("payment_id", { length: 255 }),
});

export type PurchasedProduct = typeof purchasedProductsTable.$inferSelect;
export type InsertPurchasedProduct = typeof purchasedProductsTable.$inferInsert;
