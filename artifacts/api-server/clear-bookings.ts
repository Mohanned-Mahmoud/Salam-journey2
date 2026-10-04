import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  await db.execute(sql`DELETE FROM bookings`);
  console.log('Bookings deleted');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
