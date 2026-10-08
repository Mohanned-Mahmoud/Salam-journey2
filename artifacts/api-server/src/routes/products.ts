import { Router, type IRouter } from "express";
import { db, productsTable, insertProductSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/products", async (_req, res) => {
  try {
    const products = await db.select().from(productsTable);
    res.json(products);
  } catch {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const validated = insertProductSchema.parse(req.body);
    const product = await db.insert(productsTable).values(validated).returning();
    res.status(201).json(product[0]);
  } catch {
    res.status(400).json({ error: "Invalid product data" });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const validated = insertProductSchema.partial().parse(req.body);
    const product = await db.update(productsTable).set(validated).where(eq(productsTable.id, id)).returning();
    if (!product.length) return res.status(404).json({ error: "Product not found" });
    return res.json(product[0]);
  } catch {
    return res.status(400).json({ error: "Invalid product data" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const product = await db.delete(productsTable).where(eq(productsTable.id, id)).returning();
    if (!product.length) return res.status(404).json({ error: "Product not found" });
    return res.json({ message: "Product deleted" });
  } catch {
    return res.status(500).json({ error: "Failed to delete product" });
  }
});

router.get("/products/purchased/:userId", async (req, res) => {
  try {
    const userId = req.params.userId as string;
    // We need to import purchasedProductsTable
    // Actually wait, let's just use raw query if it's easier, or import it.
    // I will import it at the top of the file in another edit.
    const { purchasedProductsTable } = await import("@workspace/db");
    
    const purchased = await db
      .select({
        id: productsTable.id,
        titleAr: productsTable.titleAr,
        titleEn: productsTable.titleEn,
        type: productsTable.type,
        downloadUrl: productsTable.downloadUrl,
        purchasedAt: purchasedProductsTable.purchasedAt
      })
      .from(purchasedProductsTable)
      .innerJoin(productsTable, eq(purchasedProductsTable.productId, productsTable.id))
      .where(eq(purchasedProductsTable.userId, userId));
      
    res.json(purchased);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch purchased products" });
  }
});

import { getUploadUrl, getFileUrl, deleteFile } from "../lib/storage";

// Generate presigned upload URL for a product file
router.post("/products/:id/upload-url", async (req, res) => {
  try {
    const { filename, contentType } = req.body as { filename?: string; contentType?: string };
    if (!filename || !contentType) {
      return res.status(400).json({ error: "filename and contentType are required" });
    }
    const fileKey = `products/${req.params.id}/${Date.now()}-${filename}`;
    const uploadUrl = await getUploadUrl(fileKey, contentType);
    return res.json({ uploadUrl, fileKey });
  } catch (error) {
    console.error("Failed to generate product upload URL:", error);
    return res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

// Generate presigned download/view URL for a product file
router.post("/products/:id/download-url", async (req, res) => {
  try {
    const { fileKey } = req.body as { fileKey?: string };
    if (!fileKey) {
      return res.status(400).json({ error: "fileKey is required" });
    }
    // Security: only allow keys that belong to this product
    if (!fileKey.startsWith(`products/${req.params.id}/`)) {
      return res.status(403).json({ error: "Unauthorized access to this file" });
    }
    const downloadUrl = await getFileUrl(fileKey);
    return res.json({ downloadUrl });
  } catch (error) {
    console.error("Failed to generate product download URL:", error);
    return res.status(500).json({ error: "Failed to generate download URL" });
  }
});

// Delete a product file from R2
router.delete("/products/:id/file", async (req, res) => {
  try {
    const { fileKey } = req.body as { fileKey?: string };
    if (!fileKey) {
      return res.status(400).json({ error: "fileKey is required" });
    }
    if (!fileKey.startsWith(`products/${req.params.id}/`)) {
      return res.status(403).json({ error: "Unauthorized access to this file" });
    }
    await deleteFile(fileKey);
    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product file:", error);
    return res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;