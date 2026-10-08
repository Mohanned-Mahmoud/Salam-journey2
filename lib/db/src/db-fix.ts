import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// Using the salam_app URL which has UPDATE permissions
const url = "postgresql://salam_app:SalamApp%232026%21Db@ep-proud-rain-almuw0am-pooler.c-3.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function main() {
  try {
    const result = await pool.query("UPDATE users SET role = 'admin' WHERE email = 'salamjourney49@gmail.com'");
    console.log(`Updated ${result.rowCount} user(s) to admin.`);
  } catch (err) {
    console.error("Error updating user:", err);
  }
  pool.end();
}
main();
