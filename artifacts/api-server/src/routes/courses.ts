import { Router, type IRouter } from "express";
import { db, coursesTable, courseRoomsTable, coachesTable, insertCourseSchema, usersTable, enrollmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { r2Client } from "../lib/storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const router: IRouter = Router();

// Helper to check if a user has authorized access to a course (admin, enrolled, or free course)
async function isUserAuthorizedForCourse(userId: string | undefined, courseId: string, course: any): Promise<boolean> {
  if (course.category === "free" || Number(course.price || 0) === 0) {
    return true;
  }
  if (!userId) return false;

  try {
    // Check if admin
    const user = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (user.length > 0 && user[0].role === "admin") {
      return true;
    }

    // Check if enrolled
    const enrollment = await db
      .select({ id: enrollmentsTable.id })
      .from(enrollmentsTable)
      .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, courseId)))
      .limit(1);

    return enrollment.length > 0;
  } catch (err) {
    console.error("Authorization check error:", err);
    return false;
  }
}

// Redact / sanitize video URLs and attachments for locked content (Anti-Inspect & Anti-Theft)
function sanitizeCourse(course: any, isAuthorized: boolean) {
  if (isAuthorized) {
    return { ...course, isUserEnrolled: true };
  }

  const rawLessons = Array.isArray(course.lessons) ? course.lessons : [];
  const sanitizedLessons = rawLessons.map((lesson: any) => {
    if (lesson.isFreePreview) {
      return { ...lesson, isLocked: false };
    }
    return {
      ...lesson,
      videoUrl: "", // Physically strip video URL so it cannot be inspected in DevTools
      attachmentUrl: "", // Physically strip private attachment
      isLocked: true,
    };
  });

  return {
    ...course,
    videoUrl: "", // Strip main course video URL
    lessons: sanitizedLessons,
    isUserEnrolled: false,
  };
}

// Get all courses (Public catalog: private videos are completely sanitized so Inspect cannot see them)
router.get("/courses", async (req, res) => {
  try {
    const userId = (req as any).userId || (req.headers["x-user-id"] as string);
    const courses = await db.select().from(coursesTable);

    // If admin, return full courses
    let isAdmin = false;
    if (userId) {
      const u = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      isAdmin = u.length > 0 && u[0].role === "admin";
    }

    if (isAdmin) {
      return res.json(courses.map((c) => ({ ...c, isUserEnrolled: true })));
    }

    // Sanitize paid courses
    const sanitized = courses.map((c) => {
      if (c.category === "free" || Number(c.price || 0) === 0) {
        return { ...c, isUserEnrolled: true };
      }
      return sanitizeCourse(c, false);
    });

    return res.json(sanitized);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// Get course by ID with rooms (Strict Paywall: only enrolled students receive private video streams)
router.get("/courses/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).userId || (req.headers["x-user-id"] as string);

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

    const isAuthorized = await isUserAuthorizedForCourse(userId, id, course[0]);
    const safeCourse = sanitizeCourse(course[0], isAuthorized);

    return res.json({ ...safeCourse, rooms });
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

// Generate presigned view/streaming URL (Protected by Paywall & Anti-Theft)
router.post("/courses/:id/download-url", async (req, res) => {
  try {
    const { fileKey } = req.body;
    if (!fileKey) {
      return res.status(400).json({ error: "fileKey is required" });
    }

    const userId = (req as any).userId || (req.headers["x-user-id"] as string);

    // Check if the file belongs to the course's folder OR matches videoUrl / lesson media
    const courseInfo = await db
      .select({
        id: coursesTable.id,
        videoUrl: coursesTable.videoUrl,
        lessons: coursesTable.lessons,
        category: coursesTable.category,
        price: coursesTable.price,
      })
      .from(coursesTable)
      .where(eq(coursesTable.id, req.params.id))
      .limit(1);

    if (!courseInfo.length) {
      return res.status(404).json({ error: "Course not found" });
    }

    const course = courseInfo[0];
    const isVideoUrl = course.videoUrl === fileKey;
    const isLessonFile =
      Array.isArray(course.lessons) &&
      course.lessons.some((l) => l.videoUrl === fileKey || l.attachmentUrl === fileKey);

    if (
      !fileKey.startsWith(`courses/${req.params.id}/`) &&
      !isVideoUrl &&
      !isLessonFile &&
      !fileKey.startsWith("courses/")
    ) {
      return res.status(403).json({ error: "Unauthorized access to this file" });
    }

    // Check if it's a free preview lesson
    const isFreePreview =
      Array.isArray(course.lessons) &&
      course.lessons.some(
        (l) => (l.videoUrl === fileKey || l.attachmentUrl === fileKey) && l.isFreePreview
      );

    // Check authorization: free preview, or enrolled student, or admin
    const authorized = isFreePreview || (await isUserAuthorizedForCourse(userId, req.params.id, course));
    if (!authorized) {
      return res.status(403).json({
        error: "هذا المحتوى محمي. يرجى الاشتراك في الدورة أولاً للوصول إلى هذا الفيديو أو الملف.",
      });
    }

    // Return the secure internal streaming endpoint (Never exposes Cloudflare R2 URLs)
    const downloadUrl = `/api/courses/${req.params.id}/stream?fileKey=${encodeURIComponent(fileKey)}`;
    return res.json({ downloadUrl });
  } catch (error) {
    console.error("Failed to generate download URL:", error);
    return res.status(500).json({ error: "Failed to generate download URL" });
  }
});

// Secure In-Platform Video Streaming Gateway (Blocks direct tab open, downloads, and DevTools inspections)
router.get("/courses/:id/stream", async (req, res): Promise<any> => {
  try {
    const courseId = req.params.id as string;
    const fileKey = (req.query.fileKey as string);
    const userId = (req as any).userId || (req.headers["x-user-id"] as string);

    // 1. Anti-Tab Navigation Guard:
    // If a user copies this link into a new browser tab or address bar,
    // all modern browsers send sec-fetch-mode: navigate or sec-fetch-dest: document.
    const secFetchMode = req.headers["sec-fetch-mode"];
    const secFetchDest = req.headers["sec-fetch-dest"];
    if (secFetchMode === "navigate" || secFetchDest === "document") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(403).send(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head><meta charset="UTF-8"><title>محتوى تعليمي محمي - رحلة سلام</title></head>
        <body style="margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0c1a17; color: #fff; font-family: system-ui, sans-serif; text-align: center; padding: 20px;">
          <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 40px; border-radius: 24px; max-width: 500px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <div style="font-size: 48px; margin-bottom: 16px;">🛡️</div>
            <h2 style="font-size: 22px; margin-bottom: 12px; color: #f87171;">غير مسموح بفتح أو تحميل هذا الفيديو خارج المنصة</h2>
            <p style="font-size: 15px; color: #d1d5db; line-height: 1.6; margin-bottom: 24px;">هذا المحتوى التعليمي محمي بحقوق النشر ومتاح للمشاهدة حصرياً داخل مشغل منصة رحلة سلام.</p>
            <a href="https://www.salamjourney.com" style="display: inline-block; padding: 12px 28px; background: #2d5a52; color: #fff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px;">العودة للمنصة</a>
          </div>
        </body>
        </html>
      `);
    }

    if (!fileKey) {
      return res.status(400).json({ error: "fileKey parameter is required" });
    }

    // 2. Fetch course & check permissions
    const courseInfo = await db
      .select({
        id: coursesTable.id,
        videoUrl: coursesTable.videoUrl,
        lessons: coursesTable.lessons,
        category: coursesTable.category,
        price: coursesTable.price,
      })
      .from(coursesTable)
      .where(eq(coursesTable.id, courseId))
      .limit(1);

    if (!courseInfo.length) {
      return res.status(404).json({ error: "Course not found" });
    }

    const course = courseInfo[0];
    const isFreePreview =
      Array.isArray(course.lessons) &&
      course.lessons.some(
        (l) => (l.videoUrl === fileKey || l.attachmentUrl === fileKey) && l.isFreePreview
      );

    const authorized = isFreePreview || (await isUserAuthorizedForCourse(userId, courseId, course));
    if (!authorized) {
      return res.status(403).json({ error: "هذا المحتوى محمي. يرجى الاشتراك في الدورة أولاً." });
    }

    // 3. Range request streaming from Cloudflare R2
    const bucket = process.env.R2_BUCKET_NAME as string;
    const range = req.headers.range;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      Range: range,
    });

    const s3Response = await r2Client.send(command);

    res.setHeader("Content-Type", s3Response.ContentType || "video/mp4");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (s3Response.ContentRange) {
      res.status(206);
      res.setHeader("Content-Range", s3Response.ContentRange);
    }
    if (s3Response.ContentLength !== undefined) {
      res.setHeader("Content-Length", s3Response.ContentLength.toString());
    }

    req.on("close", () => {
      try {
        (s3Response.Body as any)?.destroy?.();
      } catch {}
    });

    if (s3Response.Body) {
      (s3Response.Body as any).pipe(res);
    } else {
      res.status(404).end();
    }
  } catch (error: any) {
    console.error("Stream error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream video" });
    }
  }
});

export default router;
