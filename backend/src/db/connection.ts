import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});

export async function initializeDB() {
  const client = await pool.connect();
  try {
    const sqlPath = [path.join(__dirname, 'init.sql'), path.join(__dirname, '../../src/db/init.sql')].find(p =>
      fs.existsSync(p),
    );
    if (!sqlPath) throw new Error('init.sql not found');
    const initSQL = fs.readFileSync(sqlPath, 'utf-8');
    await client.query(initSQL);
    console.log('[DB] Schema initialized');
  } catch (err) {
    console.warn('[DB] Init skipped (may already exist):', err);
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('[DB] Query executed', { duration: `${duration}ms`, rows: res.rowCount });
  return res;
}

export { pool };
