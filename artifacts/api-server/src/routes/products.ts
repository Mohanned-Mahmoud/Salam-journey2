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

export default router;