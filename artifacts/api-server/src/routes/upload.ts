import { Router, type IRouter } from "express";
import multer from "multer";
import { uploadFile, getFileStream } from "../lib/storage";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB max

/**
 * GET /storage/*
 * Streams public/uploaded assets from Cloudflare R2
 */
router.get("/storage/*", async (req, res) => {
  try {
    const fileKey = (req.params as any)[0] as string;
    if (!fileKey) {
      return res.status(400).send("File key missing");
    }

    const obj = await getFileStream(fileKey);
    if (!obj.Body) {
      return res.status(404).send("File not found");
    }

    if (obj.ContentType) res.setHeader("Content-Type", obj.ContentType);
    if (obj.ContentLength) res.setHeader("Content-Length", obj.ContentLength);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");

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
