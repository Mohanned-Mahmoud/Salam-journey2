import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const { Pool } = pg;

// 🌟 حل عبقري لـ Node v22: لو السيرفر مش قاري الملف من برة، الكود هيجبره يقراه فوراً
if (!process.env.DATABASE_URL) {
  try {
    // بنشوف مكان ملف الـ .env الرئيسي ونحمله في الـ process
    const rootEnvPath = path.resolve(process.cwd(), "../../.env");
    const localEnvPath = path.resolve(process.cwd(), ".env");
    
    if (fs.existsSync(rootEnvPath)) {
      (process as any).loadEnvFile(rootEnvPath);
    } else if (fs.existsSync(localEnvPath)) {
      (process as any).loadEnvFile(localEnvPath);
    }
  } catch (envError) {
    // تجاهل الخطأ لو الميزة مش مدعومة، وسيبه يدخل على الشرط اللي تحت
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
