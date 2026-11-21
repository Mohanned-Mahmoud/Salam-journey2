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
    const body = { ...(req.body as Record<string, unknown>) };
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

    if (typeof body.price === "number") body.price = String(body.price);
    if (body.price === "" || body.price === undefined) body.price = "0";
    if (typeof body.duration === "string") body.duration = Number(body.duration) || 0;

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
    console.error("Failed to create course:", error);
    return res.status(400).json({ error: "Invalid course data", details: String(error) });
  }
});

// Update course
router.put("/courses/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const body = { ...(req.body as Record<string, unknown>) };
    if (typeof body.price === "number") body.price = String(body.price);
    if (body.price === "") body.price = "0";
    if (typeof body.duration === "string") body.duration = Number(body.duration) || 0;

    const validated = insertCourseSchema.partial().parse(body);
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
    console.error("Failed to update course:", error);
    return res.status(400).json({ error: "Invalid course data", details: String(error) });
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

// Get enrolled courses for a user
router.get("/courses/enrolled/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { enrollmentsTable } = await import("@workspace/db");
    
    const enrolled = await db
      .select({
        id: coursesTable.id,
        titleAr: coursesTable.titleAr,
        titleEn: coursesTable.titleEn,
        videoUrl: coursesTable.videoUrl,
        lessons: coursesTable.lessons,
        progress: enrollmentsTable.progress,
        completedLessons: enrollmentsTable.completedLessons,
        enrolledAt: enrollmentsTable.enrolledAt,
      })
      .from(enrollmentsTable)
      .innerJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
      .where(eq(enrollmentsTable.userId, userId));
      
    res.json(enrolled);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch enrolled courses" });
  }
});

// Update or toggle lesson progress
router.post("/courses/:id/progress", async (req, res): Promise<any> => {
  try {
    const courseId = req.params.id as string;
    const { userId, lessonId, completed } = req.body;
    if (!userId || !lessonId) {
      return res.status(400).json({ error: "userId and lessonId are required" });
    }

    const { enrollmentsTable } = await import("@workspace/db");
    const { and } = await import("drizzle-orm");

    let [enrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, courseId)))
      .limit(1);

    if (!enrollment) {
      // Auto-enroll if free course
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
      if (course && (course.category === "free" || Number(course.price || 0) === 0)) {
        const [newEnroll] = await db.insert(enrollmentsTable).values({
          userId,
          courseId,
          progress: 0,
          completedLessons: [],
        }).returning();
        enrollment = newEnroll;
      } else {
        return res.status(404).json({ error: "Enrollment not found" });
      }
    }

    const currentCompleted = Array.isArray(enrollment.completedLessons) ? [...enrollment.completedLessons] : [];
    const set = new Set(currentCompleted);
    if (completed) {
      set.add(lessonId);
    } else {
      set.delete(lessonId);
    }
    const updatedCompleted = Array.from(set);

    const [courseData] = await db
      .select({ lessons: coursesTable.lessons })
      .from(coursesTable)
      .where(eq(coursesTable.id, courseId))
      .limit(1);

    const totalLessons = Array.isArray(courseData?.lessons) && courseData.lessons.length > 0 ? courseData.lessons.length : 1;
    const progress = Math.min(100, Math.round((updatedCompleted.length / totalLessons) * 100));

    const [updated] = await db
      .update(enrollmentsTable)
      .set({
        completedLessons: updatedCompleted,
        progress,
      })
      .where(eq(enrollmentsTable.id, enrollment.id))
      .returning();

    return res.json({ success: true, progress, completedLessons: updatedCompleted });
  } catch (error: any) {
    console.error("Progress update error:", error);
    return res.status(500).json({ error: error.message || "Failed to update course progress" });
  }
});

import { getUploadUrl, getCourseFileUrl, deleteCourseFile } from "../lib/storage";

// Generate presigned upload URL
router.post("/courses/:id/upload-url", async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ error: "Filename and contentType are required" });
    }
    const fileKey = `courses/${req.params.id}/${Date.now()}-${filename}`;
    const uploadUrl = await getUploadUrl(fileKey, contentType);
    
    return res.json({ uploadUrl, fileKey });
  } catch (error) {
    console.error("Failed to generate upload URL:", error);
    return res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

// Generate presigned view/download URL
router.post("/courses/:id/download-url", async (req, res) => {
  try {
    const { fileKey } = req.body;
    if (!fileKey) {
      return res.status(400).json({ error: "fileKey is required" });
    }
    // Check if the file belongs to the course's folder OR matches videoUrl / lesson media
    const courseInfo = await db
      .select({ videoUrl: coursesTable.videoUrl, lessons: coursesTable.lessons })
      .from(coursesTable)
      .where(eq(coursesTable.id, req.params.id))
      .limit(1);

    const isVideoUrl = courseInfo.length > 0 && courseInfo[0].videoUrl === fileKey;
    const isLessonFile = courseInfo.length > 0 && Array.isArray(courseInfo[0].lessons) && courseInfo[0].lessons.some(
      (l) => l.videoUrl === fileKey || l.attachmentUrl === fileKey
    );
    if (!fileKey.startsWith(`courses/${req.params.id}/`) && !isVideoUrl && !isLessonFile && !fileKey.startsWith("courses/")) {
       return res.status(403).json({ error: "Unauthorized access to this file" });
    }

    const downloadUrl = await getCourseFileUrl(fileKey);
    return res.json({ downloadUrl });
  } catch (error) {
    console.error("Failed to generate download URL:", error);
    return res.status(500).json({ error: "Failed to generate download URL" });
  }
});

export default router;
