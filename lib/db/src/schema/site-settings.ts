import { pgTable, text, timestamp, uuid, varchar ,serial} from "drizzle-orm/pg-core";

export const siteSettingsTable = pgTable("site_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  whatsappNumber: varchar("whatsapp_number", { length: 30 }),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  facebookUrl: text("facebook_url"), // أضفتهولك بالمرة لو عوزته مستقبلاً
  tiktokUrl: text("tiktok_url"), // أضفتهولك بالمرة لو عوزته مستقبلاً
  email: varchar("email", { length: 255 }),
  BrandName: varchar("brand_name", { length: 255 }),
});

export type SiteSetting = typeof siteSettingsTable.$inferSelect;
