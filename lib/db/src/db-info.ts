import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const url = process.env.DATABASE_URL!.replace(/['"]/g, '');
const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function main() {
  console.log("🔍 فحص قاعدة البيانات الخاص بك...\n");

  try {
    // جلب كل الجداول في قاعدة البيانات
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename != 'drizzle_migrations'
      ORDER BY tablename ASC;
    `);

    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`✅ تم العثور على ${tables.length} جدول في قاعدة البيانات:\n`);

    // المرور على كل جدول وحساب عدد البيانات (الصفوف) بداخله
    for (const table of tables) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
      const count = countResult.rows[0].count;
      console.log(`- جدول [ ${table} ] يحتوي على: ${count} سجل`);
    }

    console.log("\n✅ انتهى الفحص بسلام!");
  } catch (error) {
    console.error("❌ حدث خطأ أثناء الاتصال بقاعدة البيانات:", error);
  } finally {
    pool.end();
  }
}

main();
