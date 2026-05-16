import { Router, type IRouter } from "express";
import { db, coachesTable, insertCoachSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// Get all coaches
router.get("/coaches", async (_req, res) => {
  try {
    const coaches = await db.select().from(coachesTable);
    res.json(coaches);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch coaches" });
  }
});

// Get coach by ID
router.get("/coaches/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const coach = await db
      .select()
      .from(coachesTable)
      .where(eq(coachesTable.id, id))
      .limit(1);

    if (!coach.length) {
      return res.status(404).json({ error: "Coach not found" });
    }
    return res.json(coach[0]);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch coach" });
  }
});

// Create coach
router.post("/coaches", async (req, res) => {
  try {
    const validated = insertCoachSchema.parse(req.body);
    const coach = await db
      .insert(coachesTable)
      .values(validated)
      .returning();

    res.status(201).json(coach[0]);
  } catch (error) {
    res.status(400).json({ error: "Invalid coach data" });
  }
});

// Update coach
router.put("/coaches/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const validated = insertCoachSchema.partial().parse(req.body);
    const coach = await db
      .update(coachesTable)
      .set(validated)
      .where(eq(coachesTable.id, id))
      .returning();

    if (!coach.length) {
      return res.status(404).json({ error: "Coach not found" });
    }
    return res.json(coach[0]);
  } catch (error) {
    return res.status(400).json({ error: "Invalid coach data" });
  }
});

// Delete coach
router.delete("/coaches/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const coach = await db
      .delete(coachesTable)
      .where(eq(coachesTable.id, id))
      .returning();

    if (!coach.length) {
      return res.status(404).json({ error: "Coach not found" });
    }
    return res.json({ message: "Coach deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete coach" });
  }
});

export default router;
