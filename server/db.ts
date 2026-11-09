import { parseTables, missingColumns } from './schema-sync';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

export let activeDbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || ''
};

let pool: mysql.Pool | null = null;
let lastError: string | null = null;
let latencyMs = 0;

export function isConnected() {
  return pool !== null;
}

function makePool(cfg: DatabaseConfig) {
  return mysql.createPool({
    host: cfg.host === 'localhost' ? '127.0.0.1' : cfg.host,
    port: cfg.port || 3306,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    charset: 'utf8mb4',
    timezone: 'Z',
    multipleStatements: false
  });
}

// ---------- Query helpers (parameterized => SQL injection safe) ----------
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (!pool) throw new Error('Database not connected. Check DB_HOST / DB_USER / DB_PASSWORD / DB_NAME.');
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: any[] = []): Promise<{ insertId: number; affectedRows: number }> {
  if (!pool) throw new Error('Database not connected.');
  const [res]: any = await pool.query(sql, params);
  return { insertId: res.insertId, affectedRows: res.affectedRows };
}

export async function transaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  if (!pool) throw new Error('Database not connected.');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const out = await fn(conn);
    await conn.commit();
    return out;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// ---------- Schema ----------
function readSchemaSql(): string {
  const candidates = [
    path.resolve(process.cwd(), 'server/mariadb-schema.sql'),
    path.resolve(process.cwd(), 'dist/mariadb-schema.sql'),
    path.resolve(process.cwd(), 'mariadb-schema.sql')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  throw new Error('mariadb-schema.sql not found. Upload server/mariadb-schema.sql with your app.');
}

function splitStatements(sql: string): string[] {
  const noComments = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  return noComments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export async function runMigration() {
  if (!pool) throw new Error('Database not connected.');
  const statements = splitStatements(readSchemaSql());
  const conn = await pool.getConnection();
  let executed = 0;
  try {
    for (const st of statements) {
      await conn.query(st);
      executed++;
    }
  } finally {
    conn.release();
  }
  return { success: true, count: executed, driver: 'mariadb' };
}

// Brings an older database (e.g. created from a smaller schema) up to date: creates every missing
// table and adds every missing column. Safe to run on every start (only adds, never drops/changes data).
async function reconcileSchema() {
  if (!pool) return;
  const ddl = (sql: string) => pool!.query(sql);
  for (const t of parseTables(readSchemaSql())) {
    try { await ddl(t.create); }
    catch (e: any) {
      console.warn(`[DB] create ${t.name} failed (${e.message}); retrying without foreign keys`);
      try { await ddl(t.createNoFk); } catch (e2: any) { console.warn(`[DB] create ${t.name} skipped:`, e2.message); continue; }
    }
    try {
      const rows = await query<any>(
        `SELECT column_name AS c FROM information_schema.columns WHERE table_schema = ? AND table_name = ?`,
        [activeDbConfig.database, t.name]);
      const have = new Set(rows.map((r: any) => String(r.c ?? r.C).toLowerCase()));
      for (const col of missingColumns(t, have)) {
        try {
          await ddl(`ALTER TABLE \`${t.name}\` ADD COLUMN \`${col.name}\` ${col.def}`);
          console.log(`[DB] added column ${t.name}.${col.name}`);
        } catch (e: any) { console.warn(`[DB] could not add ${t.name}.${col.name}:`, e.message); }
      }
    } catch (e: any) { console.warn(`[DB] column check failed for ${t.name}:`, e.message); }
  }
}


// Databases created from the old "simple" SQL have a different `users` table (a NOT NULL `password` column with no
// default, no password_hash) and other tables with extra NOT NULL columns. Those make every INSERT from the app fail
// (=> new users cannot be created / cannot log in). This makes every leftover column that the app does not know about
// nullable, so inserts work. It never drops columns or data.
async function relaxLegacyColumns() {
  if (!pool) return;
  const known = new Map<string, Set<string>>();
  for (const t of parseTables(readSchemaSql())) {
    const cols = new Set<string>(t.columns.map(c => c.name.toLowerCase()));
    for (const m of t.create.matchAll(/^\s+`([^`]+)`/gm)) cols.add(m[1].toLowerCase());
    known.set(t.name.toLowerCase(), cols);
  }
  const rows = await query<any>(
    `SELECT table_name AS t, column_name AS c, column_type AS ct, is_nullable AS n, column_default AS d, extra AS x, column_key AS k
       FROM information_schema.columns WHERE table_schema = ?`, [activeDbConfig.database]);
  for (const r of rows) {
    const t = String(r.t ?? r.T).toLowerCase();
    const c = String(r.c ?? r.C);
    const cols = known.get(t);
    if (!cols || cols.has(c.toLowerCase())) continue;           // table/column belongs to the current schema
    const nullable = String(r.n ?? r.N).toUpperCase() === 'YES';
    const def = r.d ?? r.D;
    const extra = String(r.x ?? r.X ?? '').toLowerCase();
    const key = String(r.k ?? r.K ?? '');
    if (nullable || def !== null || extra.includes('auto_increment') || key === 'PRI') continue;
    try {
      await pool.query(`ALTER TABLE \`${r.t ?? r.T}\` MODIFY \`${c}\` ${r.ct ?? r.CT} NULL DEFAULT NULL`);
      console.log(`[DB] relaxed legacy column ${t}.${c} (now nullable)`);
    } catch (e: any) { console.warn(`[DB] could not relax ${t}.${c}:`, e.message); }
  }
}

// Old rows (from the simple SQL) have no usable password_hash. Give them one so they are never "locked out forever".
async function fixLegacyUsers() {
  if (!pool) return;
  const bad = await query<any>(`SELECT id, role FROM users WHERE password_hash IS NULL OR password_hash = ''`);
  for (const u of bad) {
    if (u.role === 'admin') continue; // ensureAdmin() handles admins (uses ADMIN_PASSWORD from env)
    const hash = await bcrypt.hash(crypto.randomBytes(12).toString('base64url'), 10);
    await execute(`UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?`, [hash, u.id]);
    console.log(`[DB] legacy user #${u.id} had no password; set a random one (admin can reset it from the Users page).`);
  }
}

async function ensureSchema() {
  const tbl = await queryOne(
    `SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = ? AND table_name = 'users'`,
    [activeDbConfig.database]
  );
  if (!tbl || Number(tbl.c) === 0) {
    console.log('[DB] Tables not found, creating schema...');
    const r = await runMigration();
    console.log(`[DB] Schema created (${r.count} statements).`);
  }
}

// Idempotent upgrades for databases created before quizzes-assignment / homework-link existed.
async function applyUpgrades() {
  const stmts = [
    'ALTER TABLE homework MODIFY enrollment_id INT NULL',
    'ALTER TABLE homework ADD COLUMN IF NOT EXISTS session_id INT NULL',
    'ALTER TABLE homework ADD COLUMN IF NOT EXISTS link_url VARCHAR(500) NULL',
    'ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS answers LONGTEXT NULL',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_token VARCHAR(64) NULL',
    'ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS assignment_link VARCHAR(500) NULL',
    `CREATE TABLE IF NOT EXISTS quiz_assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quiz_id INT NOT NULL,
      student_id INT NOT NULL,
      assigned_by INT NOT NULL,
      due_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_quiz_student (quiz_id, student_id),
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  ];
  for (const st of stmts) {
    try { await execute(st); } catch (e: any) { console.warn('[DB] upgrade skipped:', e.message); }
  }
}

async function ensureAdmin() {
  const admin = await queryOne(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
  if (admin) {
    const broken = await queryOne(`SELECT id, email FROM users WHERE role = 'admin' AND (password_hash IS NULL OR password_hash = '') LIMIT 1`);
    if (broken) {
      let pw = process.env.ADMIN_PASSWORD;
      const gen = !pw;
      if (!pw) pw = crypto.randomBytes(9).toString('base64url');
      const mail = (process.env.ADMIN_EMAIL || (broken as any).email || 'admin@tutormonk.com').trim().toLowerCase();
      await execute(`UPDATE users SET email = ?, password_hash = ?, active = 1, must_change_password = ? WHERE id = ?`,
        [mail, await bcrypt.hash(pw, 10), gen ? 1 : 0, (broken as any).id]);
      console.log(`[DB] Admin ${mail} had no valid password (old simple SQL). Password set from ADMIN_PASSWORD.`);
      if (gen) console.log(`[DB] Temporary admin password: ${pw}  (change it after first login)`);
    }
    // Forgot / never knew the admin password? Set RESET_ADMIN_PASSWORD=true + ADMIN_PASSWORD (+ ADMIN_EMAIL) in env,
    // restart once, log in, then REMOVE RESET_ADMIN_PASSWORD so it does not reset again on every restart.
    if (String(process.env.RESET_ADMIN_PASSWORD).toLowerCase() === 'true' && process.env.ADMIN_PASSWORD) {
      const email = (process.env.ADMIN_EMAIL || 'admin@tutormonk.com').trim().toLowerCase();
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await execute(`UPDATE users SET email = ?, password_hash = ?, active = 1, must_change_password = 0 WHERE id = ?`, [email, hash, (admin as any).id]);
      console.log(`[DB] Admin password reset from env for ${email}. Remove RESET_ADMIN_PASSWORD now.`);
    }
    return;
  }

  const email = (process.env.ADMIN_EMAIL || 'admin@tutormonk.com').trim().toLowerCase();
  let password = process.env.ADMIN_PASSWORD;
  let generated = false;
  if (!password) {
    password = crypto.randomBytes(9).toString('base64url');
    generated = true;
  }
  const hash = await bcrypt.hash(password, 10);
  await execute(
    `INSERT INTO users (role, name, email, phone, password_hash, country, timezone, active, must_change_password)
     VALUES ('admin', 'Tutor Monk Admin', ?, '+919031400899', ?, 'India', 'Asia/Kolkata', 1, ?)`,
    [email, hash, generated ? 1 : 0]
  );
  console.log(`[DB] Admin created: ${email}`);
  if (generated) {
    console.log(`[DB] ADMIN_PASSWORD env was not set. Temporary password: ${password}  (change it after first login)`);
  }
}

// ---------- Connect ----------
export async function initializeDatabase(config?: Partial<DatabaseConfig>) {
  if (config) activeDbConfig = { ...activeDbConfig, ...config };

  if (pool) {
    try { await pool.end(); } catch { /* ignore */ }
    pool = null;
  }

  if (!activeDbConfig.user || !activeDbConfig.database) {
    lastError = 'DB_USER / DB_NAME not set in environment variables.';
    return { connected: false, driver: 'none', message: lastError };
  }

  try {
    const start = Date.now();
    const p = makePool(activeDbConfig);
    const conn = await p.getConnection();
    await conn.ping();
    conn.release();
    latencyMs = Date.now() - start;
    pool = p;
    lastError = null;

    await ensureSchema();
    await reconcileSchema();
    await relaxLegacyColumns();
    await applyUpgrades();
    await fixLegacyUsers();
    await ensureAdmin();

    return {
      connected: true,
      driver: 'mariadb',
      latencyMs,
      message: `Connected to MariaDB '${activeDbConfig.database}' on ${activeDbConfig.host}`
    };
  } catch (err: any) {
    pool = null;
    lastError = err.message || 'Connection failed';
    console.error('[DB] Connection failed:', lastError);
    return { connected: false, driver: 'none', error: lastError, message: `Could not connect: ${lastError}` };
  }
}

export async function testConnection(config: DatabaseConfig) {
  const start = Date.now();
  try {
    const c = await mysql.createConnection({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 7000
    });
    const [rows]: any = await c.query('SELECT VERSION() AS version, DATABASE() AS db, NOW() AS server_time');
    await c.end();
    return {
      success: true,
      latencyMs: Date.now() - start,
      serverVersion: rows[0]?.version,
      databaseName: rows[0]?.db,
      serverTime: rows[0]?.server_time,
      message: 'Connection successful'
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      error: err.message,
      code: err.code,
      hint: 'Use host localhost (or 127.0.0.1) when the database runs on the same server. For a remote database, allow remote access for this server first.'
    };
  }
}

export async function getDatabaseStatus() {
  let tables: any[] = [];
  if (pool) {
    try {
      const rows = await query(
        `SELECT table_name AS name, table_rows AS rowCount, engine FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name`,
        [activeDbConfig.database]
      );
      tables = rows.map((r: any) => ({
        name: r.name ?? r.NAME ?? r.TABLE_NAME,
        rowCount: Number(r.rowCount ?? r.ROWCOUNT ?? r.TABLE_ROWS ?? 0),
        engine: r.engine ?? r.ENGINE ?? 'InnoDB',
        description: 'Tutor Monk table'
      }));
    } catch (e: any) {
      lastError = e.message;
    }
  }
  return {
    driver: pool ? 'mariadb' : 'none',
    connected: pool !== null,
    host: activeDbConfig.host,
    port: activeDbConfig.port,
    database: activeDbConfig.database,
    user: activeDbConfig.user,
    latencyMs,
    tablesCount: tables.length,
    tables,
    lastError
  };
}

// Read-only SQL console (admin only). Single statement, SELECT / SHOW / DESCRIBE only.
export async function executeQuery(sqlQuery: string) {
  const trimmed = sqlQuery.trim().replace(/;+\s*$/, '');
  if (trimmed.includes(';')) throw new Error('Only a single statement is allowed.');
  if (!/^(select|show|describe|desc|explain)\b/i.test(trimmed)) {
    throw new Error('Console is read-only. Only SELECT / SHOW / DESCRIBE are allowed.');
  }
  const start = Date.now();
  const rows = await query(trimmed);
  const safe = (Array.isArray(rows) ? rows : [rows]).map((r: any) => {
    if (r && typeof r === 'object' && 'password_hash' in r) {
      const { password_hash, ...rest } = r;
      return rest;
    }
    return r;
  });
  return { source: 'MariaDB', durationMs: Date.now() - start, rows: safe };
}
