import { pgTable, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";
import { coursesTable } from "./courses";
import { courseRoomsTable } from "./course-rooms";

export const enrollmentsTable = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => coursesTable.id, { onDelete: "cascade" }),
  roomId: uuid("room_id").references(() => courseRoomsTable.id, { onDelete: "set null" }),
  progress: integer("progress").default(0),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
});

export const insertEnrollmentSchema = createInsertSchema(enrollmentsTable).omit({ id: true, enrolledAt: true });
export type Enrollment = typeof enrollmentsTable.$inferSelect;
export type InsertEnrollment = Omit<Enrollment, "id" | "enrolledAt">;
