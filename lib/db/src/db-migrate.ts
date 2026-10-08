import pg from "pg";

const url = "postgresql://salam_app:SalamApp%232026%21Db@ep-proud-rain-almuw0am-pooler.c-3.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function main() {
  try {
    await pool.query("ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_url VARCHAR(1024);");
    console.log("Added video_url to courses.");
    
    await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(1024);");
    console.log("Added image_url to products.");
  } catch (err) {
    console.error("Error running migration:", err);
  } finally {
    await pool.end();
  }
}
main();
