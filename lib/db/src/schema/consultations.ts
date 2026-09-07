import { createInsertSchema } from "drizzle-zod";
import {
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { leadsTable } from "./leads";

export const consultationsTable = pgTable(
  "consultations",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id")
      .notNull()
      .references(() => leadsTable.id),
    scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
    scheduledTime: text("scheduled_time").notNull(),
    status: text("status").notNull().default("booked"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueSlot: unique("consultations_scheduled_slot_unique").on(
      table.scheduledDate,
      table.scheduledTime,
    ),
  }),
);

export const insertConsultationSchema = createInsertSchema(
  consultationsTable,
).omit({
  id: true,
  createdAt: true,
});

export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultationsTable.$inferSelect;
