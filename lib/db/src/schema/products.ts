import { pgTable, varchar, text, numeric, boolean, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const productTypeEnum = pgEnum("product_type", ["pdf", "printable", "guide", "other"]);
export const productStatusEnum = pgEnum("product_status", ["active", "hidden"]);

export const productsTable = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  descAr: text("desc_ar"),
  price: numeric("price", { precision: 10, scale: 2 }),
  isFree: boolean("is_free").default(false),
  type: productTypeEnum("type").notNull(),
  downloadUrl: varchar("download_url", { length: 500 }),
  status: productStatusEnum("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type Product = typeof productsTable.$inferSelect;
export type InsertProduct = Omit<Product, "id" | "createdAt">;
