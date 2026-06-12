import { Router, type IRouter } from "express";
import { db, coursesTable, courseRoomsTable, coachesTable, insertCourseSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// Get all courses
router.get("/courses", async (_req, res) => {
  try {
    const courses = await db.select().from(coursesTable);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// Get course by ID with rooms
router.get("/courses/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const course = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, id))
      .limit(1);

    if (!course.length) {
      return res.status(404).json({ error: "Course not found" });
    }

    const rooms = await db
      .select()
      .from(courseRoomsTable)
      .where(eq(courseRoomsTable.courseId, id));

    return res.json({ ...course[0], rooms });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch course" });
  }
});

// Create course
router.post("/courses", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const coachId = typeof body.coachId === "string" && body.coachId.trim()
      ? body.coachId.trim()
      : (await db.select({ id: coachesTable.id }).from(coachesTable).limit(1))[0]?.id;

    let resolvedCoachId = coachId;
    if (!resolvedCoachId) {
      const insertedCoach = await db
        .insert(coachesTable)
        .values({
          name: "Coach Iman",
          email: "coach.iman@salamjourney.local",
          bio: "Default coach created automatically for courses.",
        })
        .returning({ id: coachesTable.id });
      resolvedCoachId = insertedCoach[0]?.id;
    }

    if (!resolvedCoachId) {
      return res.status(400).json({ error: "No coach available" });
    }

    const validated = insertCourseSchema.parse({
      ...body,
      coachId: resolvedCoachId,
    });
    const course = await db
      .insert(coursesTable)
      .values(validated)
      .returning();

    return res.status(201).json(course[0]);
  } catch (error) {
    return res.status(400).json({ error: "Invalid course data" });
  }
});

// Update course
router.put("/courses/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const validated = insertCourseSchema.partial().parse(req.body);
    const course = await db
      .update(coursesTable)
      .set(validated)
      .where(eq(coursesTable.id, id))
      .returning();

    if (!course.length) {
      return res.status(404).json({ error: "Course not found" });
    }
    return res.json(course[0]);
  } catch (error) {
    return res.status(400).json({ error: "Invalid course data" });
  }
});

// Delete course
router.delete("/courses/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const course = await db
      .delete(coursesTable)
      .where(eq(coursesTable.id, id))
      .returning();

    if (!course.length) {
      return res.status(404).json({ error: "Course not found" });
    }
    return res.json({ message: "Course deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete course" });
  }
});

export default router;
