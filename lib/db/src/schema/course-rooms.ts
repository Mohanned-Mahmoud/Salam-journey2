import { pgTable, varchar, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { coursesTable } from "./courses";

export const courseRoomsTable = pgTable("course_rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => coursesTable.id, { onDelete: "cascade" }),
  roomName: varchar("room_name", { length: 255 }).notNull(),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCourseRoomSchema = createInsertSchema(courseRoomsTable).omit({ id: true, createdAt: true });
export type CourseRoom = typeof courseRoomsTable.$inferSelect;
export type InsertCourseRoom = Omit<CourseRoom, "id" | "createdAt">;
