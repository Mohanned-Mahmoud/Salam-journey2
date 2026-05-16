import { pgTable, varchar, text, date, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";
import { coachesTable } from "./coaches";

export const bookingStatusEnum = pgEnum("booking_status", ["confirmed", "pending", "cancelled"]);

export const bookingsTable = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  coachId: uuid("coach_id")
    .notNull()
    .references(() => coachesTable.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  slot: varchar("slot", { length: 50 }),
  sessionType: varchar("session_type", { length: 100 }),
  topic: varchar("topic", { length: 255 }),
  notes: text("notes"),
  guestName: varchar("guest_name", { length: 255 }),
  guestEmail: varchar("guest_email", { length: 255 }),
  guestWhatsapp: varchar("guest_whatsapp", { length: 20 }),
  status: bookingStatusEnum("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type Booking = typeof bookingsTable.$inferSelect;
export type InsertBooking = Omit<Booking, "id" | "createdAt">;
