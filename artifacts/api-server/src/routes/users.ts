import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, insertUserSchema, type User } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function sanitizeUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

// Get all users
router.get("/users", async (_req, res) => {
  try {
    const users = await db.select().from(usersTable);
    return res.json(users.map(sanitizeUser));
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user by ID
router.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(sanitizeUser(user[0]));
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Create user
router.post("/users", async (req, res) => {
  try {
    const validated = insertUserSchema.parse(req.body);
    if (!validated.passwordHash) {
      return res.status(400).json({ error: "Invalid user data" });
    }

    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, validated.email))
      .limit(1);

    if (existing.length) {
      return res.status(409).json({ error: "email_taken" });
    }

    const hashedPassword = await bcrypt.hash(validated.passwordHash, 10);

    const user = await db
      .insert(usersTable)
      .values({
        ...validated,
        passwordHash: hashedPassword,
      })
      .returning();

    return res.status(201).json(sanitizeUser(user[0]));
  } catch (error) {
    return res.status(400).json({ error: "Invalid user data" });
  }
});

// Update user
router.put("/users/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const validated = insertUserSchema.partial().parse(req.body);
    const nextValues = {
      ...validated,
      passwordHash: validated.passwordHash ? await bcrypt.hash(validated.passwordHash, 10) : undefined,
    };

    const user = await db
      .update(usersTable)
      .set(nextValues)
      .where(eq(usersTable.id, id))
      .returning();

    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(sanitizeUser(user[0]));
  } catch (error) {
    return res.status(400).json({ error: "Invalid user data" });
  }
});

// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const user = await db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning();

    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
