import { Router, type IRouter } from "express";
import multer from "multer";
import { uploadFile } from "../lib/storage";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB max

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
