import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import bcrypt from "bcryptjs";
import { adminsTable } from "./schema/admins.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const ADMIN_EMAIL = "admin@salamjourney.com";
const ADMIN_PASSWORD = "salam2024";

const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

await db
  .insert(adminsTable)
  .values({ email: ADMIN_EMAIL, passwordHash: hash })
  .onConflictDoNothing();

console.log(`Admin seeded: ${ADMIN_EMAIL}`);
await pool.end();
