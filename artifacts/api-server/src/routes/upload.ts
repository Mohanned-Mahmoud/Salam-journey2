import { Router, type IRouter } from "express";
import multer from "multer";
import { uploadFile, getFileStream } from "../lib/storage";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB max

/**
 * GET /storage/*
 * Streams public/uploaded assets from Cloudflare R2
 */
router.get(/^\/storage\/(.*)/, async (req, res) => {
  try {
    const fileKey = (req.params as any)[0] as string;
    if (!fileKey) {
      return res.status(400).send("File key missing");
    }

    // Security Paywall for Course Media (Videos / Private attachments)
    if (fileKey.startsWith("courses/")) {
      const lower = fileKey.toLowerCase();
      const isPublicImage =
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp") ||
        lower.endsWith(".gif") ||
        lower.endsWith(".svg");

      if (!isPublicImage) {
        // This is a private course video or document
        const segments = fileKey.split("/");
        const courseId = segments[1];

        let authorized = false;
        if (courseId) {
          const { db, coursesTable, enrollmentsTable, usersTable } = await import("@workspace/db");
          const { eq, and } = await import("drizzle-orm");

          const [course] = await db
            .select()
            .from(coursesTable)
            .where(eq(coursesTable.id, courseId))
            .limit(1);

          if (course) {
            // Free course access
            if (course.category === "free" || Number(course.price || 0) === 0) {
              authorized = true;
            } else {
              // Check if free preview lesson
              const lessons = Array.isArray(course.lessons) ? course.lessons : [];
              const isFreePreviewLesson = lessons.some(
                (l: any) =>
                  (l.videoUrl === fileKey || l.attachmentUrl === fileKey) && l.isFreePreview
              );

              if (isFreePreviewLesson) {
                authorized = true;
              } else {
                const userId = (req as any).userId || (req.headers["x-user-id"] as string);
                if (userId) {
                  const [user] = await db
                    .select({ role: usersTable.role })
                    .from(usersTable)
                    .where(eq(usersTable.id, userId))
                    .limit(1);

                  if (user?.role === "admin") {
                    authorized = true;
                  } else {
                    const [enrollment] = await db
                      .select({ id: enrollmentsTable.id })
                      .from(enrollmentsTable)
                      .where(
                        and(
                          eq(enrollmentsTable.userId, userId),
                          eq(enrollmentsTable.courseId, courseId)
                        )
                      )
                      .limit(1);

                    if (enrollment) authorized = true;
                  }
                }
              }
            }
          }
        }

        if (!authorized) {
          return res.status(403).json({
            error: "المحتوى محمي. يرجى الاشتراك في الدورة لمشاهدة هذا الفيديو.",
          });
        }
      }
    }

    const obj = await getFileStream(fileKey);
    if (!obj.Body) {
      return res.status(404).send("File not found");
    }

    if (obj.ContentType) res.setHeader("Content-Type", obj.ContentType);
    if (obj.ContentLength) res.setHeader("Content-Length", obj.ContentLength);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");

    (obj.Body as any).pipe(res);
  } catch (err: any) {
    if (err?.name === "NoSuchKey") {
      return res.status(404).send("File not found");
    }
    console.error("Storage stream error:", err);
    return res.status(500).send("Failed to stream file");
  }
});

/**
 * POST /upload/:entityType/:entityId
 * entityType = 'courses' | 'products'
 * 
 * Accepts a multipart/form-data file and uploads it directly to R2.
 * Returns the R2 fileKey to save in the DB.
 */
router.post("/upload/:entityType/:entityId", upload.single("file"), async (req, res) => {
  try {
    const { entityType, entityId } = req.params as { entityType: string; entityId: string };
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!["courses", "products"].includes(entityType)) {
      return res.status(400).json({ error: "Invalid entity type" });
    }

    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileKey = `${entityType}/${entityId}/${Date.now()}-${sanitizedName}`;

    await uploadFile(fileKey, file.buffer, file.mimetype);

    return res.json({ fileKey });
  } catch (error) {
    console.error("Upload to R2 failed:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
