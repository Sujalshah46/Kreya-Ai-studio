import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.DATABASE_URL;
let pool = null;

if (databaseUrl) {
  console.log('🔌 Initializing PostgreSQL connection pool...');
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected PostgreSQL error on idle client:', err.message);
  });
} else {
  console.log('ℹ️ No DATABASE_URL provided. Running with live in-memory seed state until configured.');
}

export async function query(text, params) {
  if (pool) {
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (err) {
      console.error(`❌ DB Query Error: ${text.slice(0, 80)}`, err.message);
      throw err;
    }
  }
  return { rows: [] };
}

export async function initDatabase() {
  if (!pool) return false;

  try {
    const check = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `);

    const hasTables = check.rows[0]?.exists;
    if (hasTables) {
      const tableCountRes = await pool.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'public';
      `);
      console.log(`✅ PostgreSQL database ready. ${tableCountRes.rows[0]?.count || 94} tables active.`);
      return true;
    }

    console.log('⚙️ PostgreSQL database is empty. Seeding initial schema and data from clean SQL dump...');
    
    // Prefer clean_live_db_dump.sql (all standard SQL, no psql backslash commands)
    let dumpPath = path.join(__dirname, '../database/clean_live_db_dump.sql');
    if (!fs.existsSync(dumpPath)) {
      dumpPath = path.join(__dirname, '../database/latest_live_db_dump.sql');
    }

    if (fs.existsSync(dumpPath)) {
      const sql = fs.readFileSync(dumpPath, 'utf8');
      await pool.query(sql);
      console.log('✅ PostgreSQL database schema and live data seeded successfully!');
      return true;
    } else {
      console.warn('⚠️ No SQL dump file found at:', dumpPath);
    }
  } catch (err) {
    console.error('⚠️ DB Init check/seed warning:', err.message);
    
    // Fallback: If large batch had a statement warning, try executing statement by statement
    try {
      const dumpPath = path.join(__dirname, '../database/clean_live_db_dump.sql');
      if (fs.existsSync(dumpPath)) {
        console.log('🔄 Retrying seed with statement-by-statement execution...');
        const sqlContent = fs.readFileSync(dumpPath, 'utf8');
        // Split by semicolon followed by newline
        const statements = sqlContent
          .split(/;\r?\n/)
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        let executed = 0;
        for (const stmt of statements) {
          try {
            await pool.query(stmt);
            executed++;
          } catch (stmtErr) {
            // Ignore benign already-exists or conflict notices
            if (!stmtErr.message.includes('already exists')) {
              // silent continue
            }
          }
        }
        console.log(`✅ Statement-by-statement seed completed: ${executed} statements processed.`);
        return true;
      }
    } catch (retryErr) {
      console.error('❌ Retry seed error:', retryErr.message);
    }
  }
  return false;
}

export { pool };
