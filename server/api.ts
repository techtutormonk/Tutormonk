import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  activeDbConfig,
  getDatabaseStatus,
  testConnection,
  initializeDatabase,
  runMigration,
  executeQuery,
  query,
  queryOne,
  execute,
  transaction
} from './db';
import { isValidTz, resolveTz, fmtDate, fmtTimeZ } from '../src/utils/timezone';

const isProd = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
  if (isProd) {
    throw new Error('JWT_SECRET environment variable is required in production.');
  }
  console.warn('[API] JWT_SECRET not set - using insecure dev secret. Set it in .env!');
}
const SECRET = JWT_SECRET || 'dev-only-insecure-secret-change-me';

export const apiRouter = Router();

type Role = 'admin' | 'tutor' | 'student';
interface AuthUser { sub: number; role: Role; name: string; email: string }

// ---------- helpers ----------
const wrap = (fn: (req: Request, res: Response) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(err => {
      console.error(`[API ${req.method} ${req.path}]`, err);
      res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    });
  };

function auth(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers['authorization'];
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    try {
      const user = jwt.verify(token, SECRET) as unknown as AuthUser;
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ error: 'You do not have permission for this action' });
      }
      (req as any).user = user;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

const me = (req: Request) => (req as any).user as AuthUser;

// Simple in-memory rate limiter (per IP + bucket)
const hits = new Map<string, { n: number; reset: number }>();
function rateLimit(bucket: string, max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${bucket}:${req.ip}`;
    const now = Date.now();
    const h = hits.get(key);
    if (!h || h.reset < now) {
      hits.set(key, { n: 1, reset: now + windowMs });
      return next();
    }
    h.n++;
    if (h.n > max) return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
}, 10 * 60 * 1000).unref();

const clean = (v: any, max = 255): string | null => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
};
const cleanUrl = (v: any): string | null => {
  const s = clean(v, 500);
  if (!s) return null;
  try { const u = new URL(s); return (u.protocol === 'http:' || u.protocol === 'https:') ? s : null; } catch { return null; }
};
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const signToken = (u: any) =>
  jwt.sign({ sub: u.id, role: u.role, name: u.name, email: u.email }, SECRET, { expiresIn: '7d' });
const publicUser = (u: any) => {
  const { password_hash, ...rest } = u;
  return rest;
};
const audit = (userId: number | null, action: string, entity: string, entityId: number | null, meta: any = {}) =>
  execute(`INSERT INTO audit_log (user_id, action, entity, entity_id, meta) VALUES (?,?,?,?,?)`,
    [userId, action, entity, entityId, JSON.stringify(meta)]).catch(() => undefined);

// Returns SQL "WHERE" fragment limiting rows to what this user may see
function scope(user: AuthUser, studentCol: string, tutorCol: string | null) {
  if (user.role === 'admin') return { sql: '1=1', params: [] as any[] };
  if (user.role === 'student') return { sql: `${studentCol} = ?`, params: [user.sub] };
  if (user.role === 'tutor' && tutorCol) return { sql: `${tutorCol} = ?`, params: [user.sub] };
  return { sql: '1=0', params: [] as any[] };
}

// ==========================================
// 1. DATABASE MANAGEMENT (admin only)
// ==========================================
apiRouter.get('/database/status', auth('admin'), wrap(async (_req, res) => {
  res.json(await getDatabaseStatus());
}));

apiRouter.post('/database/test-connection', auth('admin'), wrap(async (req, res) => {
  const { host, port, user, password, database } = req.body;
  if (!host || !user || !database) return res.status(400).json({ error: 'Host, username and database are required.' });
  res.json(await testConnection({ host, port: Number(port) || 3306, user, password: password || '', database }));
}));

apiRouter.post('/database/config', auth('admin'), wrap(async (req, res) => {
  const { host, port, user, password, database } = req.body;
  const result = await initializeDatabase({ host, port: Number(port) || 3306, user, password: password || '', database });
  res.json({
    success: true,
    result,
    config: { host: activeDbConfig.host, port: activeDbConfig.port, user: activeDbConfig.user, database: activeDbConfig.database }
  });
}));

apiRouter.post('/database/migrate', auth('admin'), wrap(async (_req, res) => {
  res.json(await runMigration());
}));

apiRouter.post('/database/query', auth('admin'), wrap(async (req, res) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== 'string') return res.status(400).json({ error: 'SQL query string required.' });
  try {
    res.json(await executeQuery(sql));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}));

function sendSql(file: string, downloadName: string) {
  return (_req: Request, res: Response) => {
    const candidates = [path.resolve(process.cwd(), 'server', file), path.resolve(process.cwd(), 'dist', file), path.resolve(process.cwd(), file)];
    const found = candidates.find(p => fs.existsSync(p));
    if (!found) return res.status(404).json({ error: 'Schema file not found on server.' });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.send(fs.readFileSync(found, 'utf8'));
  };
}
// Schema has no secrets, safe to expose (used by the admin "download SQL" buttons)
apiRouter.get('/database/schema-sql', sendSql('mariadb-schema.sql', 'tutormonk_mariadb_setup.sql'));
apiRouter.get('/database/simple-schema-sql', sendSql('mariadb-schema.sql', 'tutormonk_mariadb_setup.sql'));

// WhatsApp direct link (wa.me, no API cost)
apiRouter.get('/whatsapp/link', (req, res) => {
  const phone = ((req.query.phone as string) || '+919031400899').replace(/[^0-9]/g, '');
  const student = clean(req.query.student, 80) || 'Student';
  const subject = clean(req.query.subject, 80) || '1:1 Class';
  const type = (req.query.type as string) || 'general';
  let message = `Hello! Thank you for contacting Tutor Monk. Regarding 1:1 online classes for ${student} in ${subject}, our academic counselor is ready to assist you.`;
  if (type === 'demo_confirmed') message = `Namaste! Your 1:1 Free Demo for ${student} (${subject}) has been booked. We will share the meeting link shortly.`;
  else if (type === 'reminder') message = `Reminder from Tutor Monk: ${student}'s live 1:1 class for ${subject} starts in 1 hour.`;
  res.json({ phone, message, waUrl: `https://wa.me/${phone}?text=${encodeURIComponent(message)}` });
});

// ==========================================
// 2. AUTH
// ==========================================
apiRouter.post('/auth/login', rateLimit('login', 60, 15 * 60 * 1000), wrap(async (req, res) => {
  const email = clean(req.body.email)?.toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // Family emails can be shared: check each active account with this email
  const candidates = await query(`SELECT * FROM users WHERE LOWER(email) = ? AND active = 1`, [email]);
  let found: any = null;
  for (const u of candidates) {
    let ok = false;
    try { ok = !!u.password_hash && await bcrypt.compare(password, u.password_hash); } catch { ok = false; }
    if (ok) { found = u; break; }
  }
  if (!found) return res.status(401).json({ error: 'Invalid email or password' });

  await audit(found.id, 'login', 'users', found.id);
  res.json({ token: signToken(found), user: publicUser(found), mustChangePassword: !!found.must_change_password });
}));

apiRouter.get('/auth/me', auth(), wrap(async (req, res) => {
  const u = await queryOne(`SELECT * FROM users WHERE id = ? AND active = 1`, [me(req).sub]);
  if (!u) return res.status(401).json({ error: 'Account not found' });
  res.json({ user: publicUser(u) });
}));

// Public self-signup: only student role (tutors & admins are created by admin)
apiRouter.post('/auth/register', rateLimit('register', 10, 60 * 60 * 1000), wrap(async (req, res) => {
  const name = clean(req.body.name);
  const email = clean(req.body.email)?.toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const role: Role = 'student';

  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Invalid email address' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters long' });

  const hash = await bcrypt.hash(password, 10);
  const userId = await transaction(async conn => {
    const [r]: any = await conn.query(
      `INSERT INTO users (role, name, email, phone, password_hash, country, timezone) VALUES (?,?,?,?,?,?,?)`,
      [role, name, email, clean(req.body.phone, 50), hash, clean(req.body.country, 100) || 'India',
       isValidTz(clean(req.body.timezone, 100)) ? clean(req.body.timezone, 100) : resolveTz(null, clean(req.body.country, 100) || 'India').tz]
    );
    if (role === 'student') {
      await conn.query(`INSERT INTO students (user_id, grade, curriculum) VALUES (?,?,?)`,
        [r.insertId, clean(req.body.grade, 100) || 'Grade 8', clean(req.body.curriculum, 150) || 'Standard Curriculum']);
    }
    await conn.query(`INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)`,
      [r.insertId, 'Welcome to Tutor Monk!', 'Your account is active. Explore your dashboard.']);
    return r.insertId as number;
  });
  const u = await queryOne(`SELECT * FROM users WHERE id = ?`, [userId]);
  res.status(201).json({ token: signToken(u), user: publicUser(u) });
}));

apiRouter.post('/auth/change-password', auth(), wrap(async (req, res) => {
  const { current_password, new_password } = req.body;
  if (typeof new_password !== 'string' || new_password.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters long' });
  const u = await queryOne(`SELECT * FROM users WHERE id = ?`, [me(req).sub]);
  if (!u || !(await bcrypt.compare(String(current_password || ''), u.password_hash)))
    return res.status(401).json({ error: 'Current password is incorrect' });
  await execute(`UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?`, [await bcrypt.hash(new_password, 10), u.id]);
  await audit(u.id, 'change_password', 'users', u.id);
  res.json({ success: true });
}));

// ==========================================
// 3. USERS (admin)
// ==========================================
apiRouter.get('/users', auth('admin'), wrap(async (req, res) => {
  const role = clean(req.query.role, 20);
  const rows = role
    ? await query(`SELECT id, role, name, email, phone, country, timezone, active, created_at FROM users WHERE role = ? ORDER BY id DESC`, [role])
    : await query(`SELECT id, role, name, email, phone, country, timezone, active, created_at FROM users ORDER BY id DESC LIMIT 500`);
  res.json(rows);
}));

apiRouter.post('/users', auth('admin'), wrap(async (req, res) => {
  const { role } = req.body;
  if (!['tutor', 'student', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const name = clean(req.body.name);
  const email = clean(req.body.email)?.toLowerCase();
  if (!name || !email || !isEmail(email)) return res.status(400).json({ error: 'Valid name and email are required' });

  const tempPassword = (typeof req.body.password === 'string' && req.body.password.length >= 8)
    ? req.body.password : crypto.randomBytes(7).toString('base64url');
  const hash = await bcrypt.hash(tempPassword, 10);

  const id = await transaction(async conn => {
    const [r]: any = await conn.query(
      `INSERT INTO users (role, name, email, phone, password_hash, country, timezone, must_change_password) VALUES (?,?,?,?,?,?,?,1)`,
      [role, name, email, clean(req.body.phone, 50), hash, clean(req.body.country, 100), isValidTz(clean(req.body.timezone, 100)) ? clean(req.body.timezone, 100) : resolveTz(null, clean(req.body.country, 100)).tz]
    );
    if (role === 'student') {
      await conn.query(`INSERT INTO students (user_id, grade, curriculum, school, goals) VALUES (?,?,?,?,?)`,
        [r.insertId, clean(req.body.grade, 100), clean(req.body.curriculum, 150), clean(req.body.school), clean(req.body.goals, 2000)]);
    }
    if (role === 'tutor') {
      await conn.query(
        `INSERT INTO tutors (user_id, bio, subjects, countries, qualifications, experience_years, hourly_rate, currency, status, availability)
         VALUES (?,?,?,?,?,?,?,?, 'verified', ?)`,
        [r.insertId, clean(req.body.bio, 2000), JSON.stringify(req.body.subjects || []), JSON.stringify(req.body.countries || []),
         clean(req.body.qualifications), Number(req.body.experience_years) || 0, Number(req.body.hourly_rate) || 0,
         clean(req.body.currency, 10) || 'INR', JSON.stringify(req.body.availability || {})]
      );
    }
    return r.insertId as number;
  });
  await audit(me(req).sub, 'create_user', 'users', id, { role });
  res.status(201).json({ success: true, id, tempPassword });
}));

// Admin sets a user's country / timezone (so classes show at the right local time for students abroad)
apiRouter.patch('/users/:id/timezone', auth('admin'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const tz = clean(req.body.timezone, 100);
  if (!isValidTz(tz)) return res.status(400).json({ error: 'Unknown timezone' });
  const country = req.body.country !== undefined ? clean(req.body.country, 100) : undefined;
  const r = country !== undefined
    ? await execute(`UPDATE users SET timezone = ?, country = ? WHERE id = ?`, [tz, country, id])
    : await execute(`UPDATE users SET timezone = ? WHERE id = ?`, [tz, id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'User not found' });
  await audit(me(req).sub, 'set_timezone', 'users', id, { tz });
  res.json({ success: true, timezone: tz });
}));

// Anybody can set their OWN timezone (shown first on their calendar)
apiRouter.patch('/me/timezone', auth(), wrap(async (req, res) => {
  const tz = clean(req.body.timezone, 100);
  if (!isValidTz(tz)) return res.status(400).json({ error: 'Unknown timezone' });
  await execute(`UPDATE users SET timezone = ? WHERE id = ?`, [tz, me(req).sub]);
  res.json({ success: true, timezone: tz });
}));

// Admin resets anybody's password -> returns a new temporary password (user must change it at next login)
apiRouter.post('/users/:id/reset-password', auth('admin'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const custom = typeof req.body.password === 'string' && req.body.password.length >= 8 ? req.body.password : null;
  const tempPassword = custom || crypto.randomBytes(7).toString('base64url');
  const r = await execute(`UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?`,
    [await bcrypt.hash(tempPassword, 10), id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'User not found' });
  await audit(me(req).sub, 'reset_password', 'users', id);
  res.json({ success: true, tempPassword });
}));

apiRouter.patch('/users/:id/active', auth('admin'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (id === me(req).sub) return res.status(400).json({ error: 'You cannot deactivate your own account' });
  await execute(`UPDATE users SET active = ? WHERE id = ?`, [req.body.active ? 1 : 0, id]);
  await audit(me(req).sub, 'set_active', 'users', id, { active: !!req.body.active });
  res.json({ success: true });
}));

// ==========================================
// 4. DASHBOARD
// ==========================================
apiRouter.get('/dashboard', auth('admin'), wrap(async (_req, res) => {
  const one = async (sql: string) => Number((await queryOne<any>(sql))?.c || 0);
  const [students, tutors, enrollments, upcoming, newLeads, classesDone] = await Promise.all([
    one(`SELECT COUNT(*) c FROM users WHERE role='student' AND active=1`),
    one(`SELECT COUNT(*) c FROM tutors WHERE status='verified'`),
    one(`SELECT COUNT(*) c FROM enrollments WHERE status='active'`),
    one(`SELECT COUNT(*) c FROM sessions WHERE status='scheduled' AND starts_at >= UTC_TIMESTAMP()`),
    one(`SELECT COUNT(*) c FROM leads WHERE status='new'`),
    one(`SELECT COUNT(*) c FROM sessions WHERE status='completed'`)
  ]);
  const totalLeads = await one(`SELECT COUNT(*) c FROM leads`);
  const converted = await one(`SELECT COUNT(*) c FROM leads WHERE status='converted'`);
  res.json({
    kpis: {
      activeStudents: students,
      verifiedTutors: tutors,
      activeEnrollments: enrollments,
      upcomingSessions: upcoming,
      pendingLeads: newLeads,
      totalClassesDelivered: classesDone,
      demoConversionRate: totalLeads ? `${((converted / totalLeads) * 100).toFixed(1)}%` : '0%'
    },
    upcomingClasses: await query(`SELECT * FROM sessions WHERE status='scheduled' ORDER BY starts_at ASC LIMIT 5`),
    recentLeads: await query(`SELECT * FROM leads ORDER BY id DESC LIMIT 5`)
  });
}));

// ==========================================
// 5. LEADS
// ==========================================
// Public: demo booking from website
apiRouter.post('/leads', rateLimit('lead', 20, 60 * 60 * 1000), wrap(async (req, res) => {
  const name = clean(req.body.name);
  const studentName = clean(req.body.student_name);
  const phone = clean(req.body.phone, 50);
  const email = clean(req.body.email)?.toLowerCase() || null;

  if (!name && !studentName) return res.status(400).json({ error: 'Parent or student name is required' });
  if (!phone && !email) return res.status(400).json({ error: 'Phone or email is required so we can contact you' });
  if (email && !isEmail(email)) return res.status(400).json({ error: 'Invalid email address' });

  const r = await execute(
    `INSERT INTO leads (name, phone, email, country, student_name, grade, subject, message, source, status, notes)
     VALUES (?,?,?,?,?,?,?,?,?, 'new', ?)`,
    [
      name || `Parent of ${studentName}`, phone, email, clean(req.body.country, 100), studentName || name,
      clean(req.body.grade, 100), clean(req.body.subject, 150), clean(req.body.message, 2000),
      clean(req.body.source, 100) || 'website', 'Free 1:1 demo requested from website.'
    ]
  );

  if (phone) {
    await execute(
      `INSERT INTO outbox (channel, to_addr, body, meta, status) VALUES ('whatsapp', ?, ?, ?, 'pending')`,
      [phone, `Namaste ${name || ''}! Your free 1:1 demo request for ${studentName || 'your child'} is received. Our counselor will contact you shortly.`,
       JSON.stringify({ lead_id: r.insertId })]
    ).catch(() => undefined);
  }
  res.status(201).json({ success: true, id: r.insertId });
}));

apiRouter.get('/leads', auth('admin'), wrap(async (_req, res) => {
  res.json(await query(`SELECT * FROM leads ORDER BY id DESC LIMIT 1000`));
}));

apiRouter.patch('/leads/:id', auth('admin'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ['status', 'notes', 'assigned_to'];
  const sets: string[] = [];
  const params: any[] = [];
  for (const k of allowed) {
    if (k in req.body) {
      if (k === 'status' && !['new', 'contacted', 'demo_booked', 'converted', 'lost'].includes(req.body.status))
        return res.status(400).json({ error: 'Invalid status' });
      sets.push(`${k} = ?`);
      params.push(req.body[k]);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
  const r = await execute(`UPDATE leads SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Lead not found' });
  await audit(me(req).sub, 'update_lead', 'leads', id, req.body);
  res.json(await queryOne(`SELECT * FROM leads WHERE id = ?`, [id]));
}));

apiRouter.post('/leads/:id/convert', auth('admin'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const lead = await queryOne<any>(`SELECT * FROM leads WHERE id = ?`, [id]);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (lead.converted_user_id) return res.status(409).json({ error: 'Lead already converted' });

  const tempPassword = crypto.randomBytes(7).toString('base64url');
  const hash = await bcrypt.hash(tempPassword, 10);
  const email = lead.email || `student_${Date.now()}@tutormonk.student`;

  const userId = await transaction(async conn => {
    const [u]: any = await conn.query(
      `INSERT INTO users (role, name, email, phone, password_hash, country, must_change_password) VALUES ('student',?,?,?,?,?,1)`,
      [lead.student_name || lead.name, email, lead.phone, hash, lead.country]
    );
    await conn.query(`INSERT INTO students (user_id, grade, goals) VALUES (?,?,?)`, [u.insertId, lead.grade, lead.message]);
    await conn.query(`UPDATE leads SET status='converted', converted_user_id=? WHERE id=?`, [u.insertId, id]);
    return u.insertId as number;
  });
  await audit(me(req).sub, 'convert_lead', 'leads', id, { user_id: userId });
  res.json({ success: true, student_id: userId, email, tempPassword });
}));

// ==========================================
// 6. COURSES & ENROLLMENTS
// ==========================================
apiRouter.get('/courses', wrap(async (_req, res) => {
  res.json(await query(`SELECT * FROM courses WHERE active = 1 ORDER BY id`));
}));

apiRouter.post('/courses', auth('admin'), wrap(async (req, res) => {
  const title = clean(req.body.title);
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const r = await execute(
    `INSERT INTO courses (title, country, category, grade_band, description, price, currency, active) VALUES (?,?,?,?,?,?,?,1)`,
    [title, clean(req.body.country, 100), clean(req.body.category, 100), clean(req.body.grade_band, 100),
     clean(req.body.description, 3000), Number(req.body.price) || 0, clean(req.body.currency, 10) || 'INR']
  );
  res.status(201).json({ success: true, id: r.insertId });
}));

apiRouter.get('/enrollments', auth(), wrap(async (req, res) => {
  const s = scope(me(req), 'e.student_id', 'e.tutor_id');
  res.json(await query(
    `SELECT e.*, su.name AS student_name, tu.name AS tutor_name, c.title AS course_title
     FROM enrollments e
     JOIN users su ON su.id = e.student_id
     JOIN users tu ON tu.id = e.tutor_id
     JOIN courses c ON c.id = e.course_id
     WHERE ${s.sql} ORDER BY e.id DESC LIMIT 500`, s.params));
}));

// A student can be mapped to any number of teachers (different subjects / slots). The only rule is that the same
// student + teacher + course combination cannot be active twice.
async function createEnrollments(adminId: number, studentId: number, items: { tutor_id: number; course_id: number; classes_total?: number }[]) {
  const created: number[] = [];
  const skipped: { tutor_id: number; course_id: number; reason: string }[] = [];
  await transaction(async conn => {
    for (const it of items) {
      const [dup]: any = await conn.query(
        `SELECT id FROM enrollments WHERE student_id = ? AND tutor_id = ? AND course_id = ? AND status IN ('active','paused') LIMIT 1`,
        [studentId, it.tutor_id, it.course_id]);
      if (dup.length) { skipped.push({ tutor_id: it.tutor_id, course_id: it.course_id, reason: 'Already assigned' }); continue; }
      const [r]: any = await conn.query(
        `INSERT INTO enrollments (student_id, course_id, tutor_id, status, classes_total, classes_used, start_date)
         VALUES (?,?,?, 'active', ?, 0, CURDATE())`, [studentId, it.course_id, it.tutor_id, Number(it.classes_total) || 10]);
      created.push(r.insertId as number);
    }
  });
  for (const id of created) await audit(adminId, 'create_enrollment', 'enrollments', id);
  return { created, skipped };
}

apiRouter.post('/enrollments', auth('admin'), wrap(async (req, res) => {
  const studentId = Number(req.body.student_id);
  const courseId = Number(req.body.course_id);
  const tutorId = Number(req.body.tutor_id);
  if (!studentId || !courseId || !tutorId) return res.status(400).json({ error: 'student_id, course_id and tutor_id are required' });
  try {
    const r = await createEnrollments(me(req).sub, studentId, [{ tutor_id: tutorId, course_id: courseId, classes_total: req.body.classes_total }]);
    if (!r.created.length) return res.status(409).json({ error: 'This student already has this teacher assigned for this course.' });
    res.status(201).json(await queryOne(`SELECT * FROM enrollments WHERE id = ?`, [r.created[0]]));
  } catch (e: any) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Student, tutor or course does not exist.' });
    throw e;
  }
}));

// Map one student to several teachers at once: { student_id, assignments: [{ tutor_id, course_id, classes_total }] }
apiRouter.post('/enrollments/bulk', auth('admin'), wrap(async (req, res) => {
  const studentId = Number(req.body.student_id);
  const list = Array.isArray(req.body.assignments) ? req.body.assignments : [];
  if (!studentId) return res.status(400).json({ error: 'student_id is required' });
  if (!list.length) return res.status(400).json({ error: 'Add at least one teacher assignment' });
  if (list.length > 20) return res.status(400).json({ error: 'Maximum 20 assignments at a time' });
  const items = list.map((x: any) => ({ tutor_id: Number(x.tutor_id), course_id: Number(x.course_id), classes_total: Number(x.classes_total) || 10 }));
  if (items.some((x: any) => !x.tutor_id || !x.course_id)) return res.status(400).json({ error: 'Every assignment needs a teacher and a course' });
  try {
    res.status(201).json({ success: true, ...(await createEnrollments(me(req).sub, studentId, items)) });
  } catch (e: any) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Student, tutor or course does not exist.' });
    throw e;
  }
}));

// Pause / resume / end a teacher assignment without touching the other teachers of the student
apiRouter.patch('/enrollments/:id/status', auth('admin'), wrap(async (req, res) => {
  const status = clean(req.body.status, 20);
  if (!status || !['active', 'paused', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const r = await execute(`UPDATE enrollments SET status = ? WHERE id = ?`, [status, Number(req.params.id)]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Assignment not found' });
  await audit(me(req).sub, 'update_enrollment', 'enrollments', Number(req.params.id), { status });
  res.json({ success: true });
}));

// ==========================================
// 7. SESSIONS (live classes)
// ==========================================
apiRouter.get('/sessions', auth(), wrap(async (req, res) => {
  const s = scope(me(req), 's.student_id', 's.tutor_id');
  res.json(await query(
    `SELECT s.*, su.name AS student_name, su.timezone AS student_timezone, su.country AS student_country,
            tu.name AS tutor_name, tu.timezone AS tutor_timezone, tu.country AS tutor_country, e.assignment_link
     FROM sessions s JOIN users su ON su.id = s.student_id JOIN users tu ON tu.id = s.tutor_id
     LEFT JOIN enrollments e ON e.id = s.enrollment_id
     WHERE ${s.sql} ORDER BY s.starts_at DESC LIMIT 500`, s.params));
}));

apiRouter.post('/sessions', auth('admin', 'tutor'), wrap(async (req, res) => {
  const user = me(req);
  const tutorId = user.role === 'tutor' ? user.sub : Number(req.body.tutor_id);
  const studentId = Number(req.body.student_id);
  if (!tutorId || !studentId) return res.status(400).json({ error: 'tutor_id and student_id are required' });

  const start = req.body.starts_at ? new Date(req.body.starts_at) : null;
  if (!start || isNaN(start.getTime())) return res.status(400).json({ error: 'Valid starts_at is required' });
  const dur = Math.min(Math.max(Number(req.body.duration_min) || 60, 15), 240);
  const end = new Date(start.getTime() + dur * 60000);

  // Only ADMIN can add Google Meet / whiteboard links. Tutors & students can only join them.
  let meetLink: string | null = null, wbLink: string | null = null, meetingUrl: string | null = null;
  if (user.role === 'admin') {
    for (const k of ['meet_link', 'whiteboard_link', 'meeting_url']) {
      if (req.body[k] && !cleanUrl(req.body[k])) return res.status(400).json({ error: `${k.replace('_', ' ')} must be a valid http(s) link` });
    }
    meetLink = cleanUrl(req.body.meet_link); wbLink = cleanUrl(req.body.whiteboard_link); meetingUrl = cleanUrl(req.body.meeting_url);
  }

  try {
    const r = await execute(
      `INSERT INTO sessions (enrollment_id, tutor_id, student_id, title, starts_at, ends_at, duration_min, meeting_url, meet_link, whiteboard_link, recording_url, transcript_text, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'scheduled')`,
      [req.body.enrollment_id ? Number(req.body.enrollment_id) : null, tutorId, studentId,
       clean(req.body.title) || '1:1 Live Class', start, end, dur,
       meetingUrl, meetLink, wbLink,
       clean(req.body.recording_url, 500), clean(req.body.transcript_text, 50000)]);
    res.status(201).json(await queryOne(`SELECT * FROM sessions WHERE id = ?`, [r.insertId]));
  } catch (e: any) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Student or tutor does not exist.' });
    throw e;
  }
}));

// Completing a class. Homework is OPTIONAL: the tutor may add a link, a text instruction, both, or nothing.
apiRouter.post('/sessions/:id/complete', auth('admin', 'tutor'), wrap(async (req, res) => {
  const user = me(req);
  const id = Number(req.params.id);
  const hwLink = cleanUrl(req.body.homework_link);
  const hwTitle = clean(req.body.homework_title, 255);
  const hwNote = clean(req.body.homework_description, 5000);

  const pre = await queryOne<any>(`SELECT * FROM sessions WHERE id = ?`, [id]);
  if (!pre) return res.status(404).json({ error: 'Session not found' });
  if (user.role === 'tutor' && pre.tutor_id !== user.sub) return res.status(403).json({ error: 'Not your session' });
  if (pre.status === 'completed') return res.status(409).json({ error: 'Session already completed' });
  if (pre.status === 'cancelled') return res.status(409).json({ error: 'This class is cancelled. Restore it before completing.' });
  if (req.body.homework_link && !hwLink) {
    return res.status(400).json({ error: 'Homework link must be a valid http(s) link.' });
  }

  const result = await transaction(async conn => {
    const [rows]: any = await conn.query(`SELECT * FROM sessions WHERE id = ? FOR UPDATE`, [id]);
    const sess = rows[0];
    if (!sess) return { code: 404 };
    if (sess.status === 'completed') return { code: 409 };
    await conn.query(
      `UPDATE sessions SET status='completed', student_attended=1, tutor_attended=1, notes=COALESCE(?, notes) WHERE id = ?`,
      [clean(req.body.notes, 2000), id]);
    if (sess.enrollment_id) {
      await conn.query(`UPDATE enrollments SET classes_used = classes_used + 1 WHERE id = ?`, [sess.enrollment_id]);
    }
    if (hwLink || hwNote) {
      await conn.query(
        `INSERT INTO homework (enrollment_id, session_id, tutor_id, student_id, title, description, link_url) VALUES (?,?,?,?,?,?,?)`,
        [sess.enrollment_id || null, id, sess.tutor_id, sess.student_id, hwTitle || `Homework: ${sess.title || 'Class'}`, hwNote, hwLink]);
      await conn.query(`INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)`,
        [sess.student_id, 'New homework assigned', `Homework for "${sess.title || 'your class'}" is ready. Open your dashboard to see it.`]);
    }
    return { code: 200 };
  });
  if (result.code === 404) return res.status(404).json({ error: 'Session not found' });
  if (result.code === 409) return res.status(409).json({ error: 'Session already completed' });
  res.json({ success: true, session: await queryOne(`SELECT * FROM sessions WHERE id = ?`, [id]) });
}));

// Admin-only: add / change / clear the Google Meet and whiteboard links of a class
apiRouter.patch('/sessions/:id/links', auth('admin'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const sess = await queryOne<any>(`SELECT * FROM sessions WHERE id = ?`, [id]);
  if (!sess) return res.status(404).json({ error: 'Session not found' });
  const sets: string[] = [];
  const params: any[] = [];
  for (const k of ['meet_link', 'whiteboard_link'] as const) {
    if (k in req.body) {
      const raw = clean(req.body[k], 500);
      const val = raw ? cleanUrl(raw) : null;
      if (raw && !val) return res.status(400).json({ error: `${k === 'meet_link' ? 'Google Meet' : 'Whiteboard'} link must be a valid http(s) link` });
      sets.push(`${k} = ?`); params.push(val);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
  await execute(`UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  for (const uid of [sess.tutor_id, sess.student_id]) {
    await execute(`INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)`,
      [uid, 'Class link updated', `Join links for "${sess.title || 'your class'}" were updated. Open your dashboard to join.`]).catch(() => undefined);
  }
  await audit(me(req).sub, 'update_session_links', 'sessions', id);
  res.json({ success: true, session: await queryOne(`SELECT * FROM sessions WHERE id = ?`, [id]) });
}));

// ---------- Recurring classes ----------
// The browser expands the rule in the user's local time (so daylight-saving changes are handled) and sends the
// concrete start times in `occurrences`. The server validates them, stores the rule and creates every session at once.
apiRouter.post('/sessions/recurring', auth('admin', 'tutor'), wrap(async (req, res) => {
  const user = me(req);
  const tutorId = user.role === 'tutor' ? user.sub : Number(req.body.tutor_id);
  const studentId = Number(req.body.student_id);
  if (!tutorId || !studentId) return res.status(400).json({ error: 'tutor_id and student_id are required' });

  const raw: any[] = Array.isArray(req.body.occurrences) ? req.body.occurrences : [];
  const times = [...new Set(raw.map(x => new Date(x).getTime()).filter(t => !isNaN(t)))].sort((a, b) => a - b);
  if (!times.length) return res.status(400).json({ error: 'No class dates were generated. Check the days, time and end condition.' });
  if (times.length > 200) return res.status(400).json({ error: 'A series can have at most 200 classes.' });
  if (times[times.length - 1] - times[0] > 800 * 86400000) return res.status(400).json({ error: 'A series can span at most about 2 years.' });

  const dur = Math.min(Math.max(Number(req.body.duration_min) || 60, 15), 240);
  let meetLink: string | null = null, wbLink: string | null = null;
  if (user.role === 'admin') {
    for (const k of ['meet_link', 'whiteboard_link']) if (req.body[k] && !cleanUrl(req.body[k])) return res.status(400).json({ error: `${k.replace('_', ' ')} must be a valid http(s) link` });
    meetLink = cleanUrl(req.body.meet_link); wbLink = cleanUrl(req.body.whiteboard_link);
  }
  const title = clean(req.body.title) || 'Live Class';
  const enrollmentId = req.body.enrollment_id ? Number(req.body.enrollment_id) : null;

  try {
    const out = await transaction(async conn => {
      const [sr]: any = await conn.query(
        `INSERT INTO session_series (enrollment_id, tutor_id, student_id, title, rule, created_by) VALUES (?,?,?,?,?,?)`,
        [enrollmentId, tutorId, studentId, title, JSON.stringify(req.body.rule || {}).slice(0, 5000), user.sub]);
      for (const t of times) {
        const start = new Date(t);
        await conn.query(
          `INSERT INTO sessions (enrollment_id, tutor_id, student_id, title, starts_at, ends_at, duration_min, meet_link, whiteboard_link, status, series_id)
           VALUES (?,?,?,?,?,?,?,?,?, 'scheduled', ?)`,
          [enrollmentId, tutorId, studentId, title, start, new Date(t + dur * 60000), dur, meetLink, wbLink, sr.insertId]);
      }
      await conn.query(`INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)`,
        [studentId, 'Recurring classes scheduled', `${times.length} classes of "${title}" have been added to your calendar.`]);
      return sr.insertId as number;
    });
    await audit(user.sub, 'create_series', 'session_series', out, { count: times.length });
    res.status(201).json({ success: true, series_id: out, count: times.length });
  } catch (e: any) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Student or tutor does not exist.' });
    throw e;
  }
}));

const fmtIST = (d: any) => new Date(d).toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
}) + ' IST';

async function ownSession(req: Request, res: Response) {
  const user = me(req);
  const sess = await queryOne<any>(
    `SELECT s.*, su.name AS student_name, su.timezone AS student_timezone, su.country AS student_country,
            tu.timezone AS tutor_timezone, tu.country AS tutor_country
     FROM sessions s JOIN users su ON su.id = s.student_id JOIN users tu ON tu.id = s.tutor_id WHERE s.id = ?`, [Number(req.params.id)]);
  if (!sess) { res.status(404).json({ error: 'Class not found' }); return null; }
  if (user.role === 'tutor' && sess.tutor_id !== user.sub) { res.status(403).json({ error: 'Not your class' }); return null; }
  return sess;
}
// Each person is notified in THEIR OWN time zone (student abroad sees e.g. "6:30 AM EST", teacher sees "5:00 PM IST")
const when = (d: any, tz: string) => `${fmtDate(new Date(d).getTime(), tz)}, ${fmtTimeZ(new Date(d).getTime(), tz)}`;
const notifyBoth = (sess: any, title: string, body: (tz: string) => string) => {
  const stz = resolveTz(sess.student_timezone, sess.student_country).tz;
  const ttz = resolveTz(sess.tutor_timezone, sess.tutor_country).tz;
  return Promise.all([[sess.student_id, stz], [sess.tutor_id, ttz]].map(([uid, tz]) =>
    execute(`INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)`, [uid, title, body(tz as string)]).catch(() => undefined)));
};

// Move ONE class to a new slot. Other classes of the same series are not touched.
apiRouter.patch('/sessions/:id/reschedule', auth('admin', 'tutor'), wrap(async (req, res) => {
  const sess = await ownSession(req, res); if (!sess) return;
  if (sess.status !== 'scheduled') return res.status(409).json({ error: `A ${sess.status} class cannot be rescheduled.` });
  const start = req.body.starts_at ? new Date(req.body.starts_at) : null;
  if (!start || isNaN(start.getTime())) return res.status(400).json({ error: 'A valid new date and time is required' });
  const dur = Math.min(Math.max(Number(req.body.duration_min) || sess.duration_min || 60, 15), 240);
  await execute(
    `UPDATE sessions SET starts_at = ?, ends_at = ?, duration_min = ?, rescheduled = 1,
       original_starts_at = COALESCE(original_starts_at, ?), notes = COALESCE(?, notes) WHERE id = ?`,
    [start, new Date(start.getTime() + dur * 60000), dur, sess.starts_at, clean(req.body.reason, 500) ? `Rescheduled: ${clean(req.body.reason, 480)}` : null, sess.id]);
  const reason = clean(req.body.reason, 200);
  await notifyBoth(sess, 'Class rescheduled',
    tz => `"${sess.title || 'Class'}" (${sess.student_name}) moved from ${when(sess.starts_at, tz)} to ${when(start, tz)}.${reason ? ` Reason: ${reason}` : ''}`);
  await audit(me(req).sub, 'reschedule_session', 'sessions', sess.id);
  res.json({ success: true, session: await queryOne(`SELECT * FROM sessions WHERE id = ?`, [sess.id]) });
}));

// Cancel ONE class. The rest of the recurring series stays scheduled.
apiRouter.post('/sessions/:id/cancel', auth('admin', 'tutor'), wrap(async (req, res) => {
  const sess = await ownSession(req, res); if (!sess) return;
  if (sess.status !== 'scheduled') return res.status(409).json({ error: `A ${sess.status} class cannot be cancelled.` });
  await execute(`UPDATE sessions SET status = 'cancelled', cancel_reason = ? WHERE id = ?`, [clean(req.body.reason, 255), sess.id]);
  await notifyBoth(sess, 'Class cancelled', tz => `"${sess.title || 'Class'}" on ${when(sess.starts_at, tz)} has been cancelled.`);
  await audit(me(req).sub, 'cancel_session', 'sessions', sess.id);
  res.json({ success: true });
}));

// Undo a cancellation (only for classes that have not started yet)
apiRouter.post('/sessions/:id/restore', auth('admin', 'tutor'), wrap(async (req, res) => {
  const sess = await ownSession(req, res); if (!sess) return;
  if (sess.status !== 'cancelled') return res.status(409).json({ error: 'Only a cancelled class can be restored.' });
  if (new Date(sess.starts_at).getTime() < Date.now()) return res.status(409).json({ error: 'This class date has already passed. Reschedule it instead.' });
  await execute(`UPDATE sessions SET status = 'scheduled', cancel_reason = NULL WHERE id = ?`, [sess.id]);
  res.json({ success: true });
}));

// Stop a whole recurring series: cancels every upcoming class of it (past classes are kept)
apiRouter.post('/series/:id/cancel-future', auth('admin', 'tutor'), wrap(async (req, res) => {
  const user = me(req);
  const series = await queryOne<any>(`SELECT * FROM session_series WHERE id = ?`, [Number(req.params.id)]);
  if (!series) return res.status(404).json({ error: 'Series not found' });
  if (user.role === 'tutor' && series.tutor_id !== user.sub) return res.status(403).json({ error: 'Not your series' });
  const r = await execute(
    `UPDATE sessions SET status = 'cancelled', cancel_reason = ? WHERE series_id = ? AND status = 'scheduled' AND starts_at > ?`,
    [clean(req.body.reason, 255) || 'Series ended', series.id, new Date()]);
  await audit(user.sub, 'cancel_series', 'session_series', series.id, { cancelled: r.affectedRows });
  res.json({ success: true, cancelled: r.affectedRows });
}));

apiRouter.post('/sessions/:id/remark', auth('admin', 'tutor'), wrap(async (req, res) => {
  const user = me(req);
  const id = Number(req.params.id);
  const sess = await queryOne<any>(`SELECT * FROM sessions WHERE id = ?`, [id]);
  if (!sess) return res.status(404).json({ error: 'Session not found' });
  if (user.role === 'tutor' && sess.tutor_id !== user.sub) return res.status(403).json({ error: 'Not your session' });
  const remark = clean(req.body.remark, 5000);
  if (!remark) return res.status(400).json({ error: 'Remark text is required' });
  const understanding = Math.min(Math.max(Number(req.body.understanding) || 5, 1), 5);

  await execute(
    `INSERT INTO class_remarks (session_id, student_id, tutor_id, remark, topics, understanding, private, updated_at)
     VALUES (?,?,?,?,?,?,?, UTC_TIMESTAMP())
     ON DUPLICATE KEY UPDATE remark=VALUES(remark), topics=VALUES(topics), understanding=VALUES(understanding),
       private=VALUES(private), updated_at=UTC_TIMESTAMP()`,
    [id, sess.student_id, sess.tutor_id, remark, clean(req.body.topics), understanding, req.body.private ? 1 : 0]);
  res.status(201).json({ success: true });
}));

apiRouter.get('/sessions/:id/remarks', auth(), wrap(async (req, res) => {
  const user = me(req);
  const s = scope(user, 'r.student_id', 'r.tutor_id');
  const privacy = user.role === 'student' ? 'AND r.private = 0' : '';
  res.json(await query(`SELECT r.* FROM class_remarks r WHERE r.session_id = ? AND ${s.sql} ${privacy}`, [Number(req.params.id), ...s.params]));
}));

// ==========================================
// 8. HOMEWORK
// ==========================================
apiRouter.get('/homework', auth(), wrap(async (req, res) => {
  const s = scope(me(req), 'h.student_id', 'h.tutor_id');
  res.json(await query(
    `SELECT h.*, su.name AS student_name, sub.id AS submission_id, sub.text AS submission_text, sub.file_url AS submission_file, sub.submitted_at, sub.grade, sub.feedback
     FROM homework h JOIN users su ON su.id = h.student_id LEFT JOIN submissions sub ON sub.homework_id = h.id
     WHERE ${s.sql} ORDER BY h.id DESC LIMIT 500`, s.params));
}));

apiRouter.post('/homework', auth('admin', 'tutor'), wrap(async (req, res) => {
  const user = me(req);
  const title = clean(req.body.title);
  const link = cleanUrl(req.body.link_url);
  if (req.body.link_url && !link) return res.status(400).json({ error: 'Homework link must be a valid http(s) URL' });
  const due = req.body.due_at ? new Date(req.body.due_at) : null;
  const dueAt = due && !isNaN(due.getTime()) ? due : null;

  // Mode A: attach homework to a specific class session (link and/or text; both optional but at least one needed here)
  if (req.body.session_id) {
    const sess = await queryOne<any>(`SELECT * FROM sessions WHERE id = ?`, [Number(req.body.session_id)]);
    if (!sess) return res.status(404).json({ error: 'Session not found' });
    if (user.role === 'tutor' && sess.tutor_id !== user.sub) return res.status(403).json({ error: 'Not your session' });
    if (!link && !clean(req.body.description, 5000)) return res.status(400).json({ error: 'Add a homework link or some instructions' });
    const dup = await queryOne<any>(`SELECT id FROM homework WHERE session_id = ?`, [sess.id]);
    if (dup) return res.status(409).json({ error: 'Homework already added for this class' });
    const r = await execute(
      `INSERT INTO homework (enrollment_id, session_id, tutor_id, student_id, title, description, due_at, link_url) VALUES (?,?,?,?,?,?,?,?)`,
      [sess.enrollment_id || null, sess.id, sess.tutor_id, sess.student_id, title || `Homework: ${sess.title || 'Class'}`, clean(req.body.description, 5000), dueAt, link]);
    await execute(`INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)`,
      [sess.student_id, 'New homework assigned', `Homework for "${sess.title || 'your class'}" is ready.`]).catch(() => undefined);
    return res.status(201).json({ success: true, id: r.insertId });
  }

  // Mode B: general homework for an enrollment
  const enrollmentId = Number(req.body.enrollment_id);
  if (!enrollmentId || !title) return res.status(400).json({ error: 'enrollment_id and title are required' });
  const enr = await queryOne<any>(`SELECT * FROM enrollments WHERE id = ?`, [enrollmentId]);
  if (!enr) return res.status(404).json({ error: 'Enrollment not found' });
  if (user.role === 'tutor' && enr.tutor_id !== user.sub) return res.status(403).json({ error: 'Not your student' });
  const r = await execute(
    `INSERT INTO homework (enrollment_id, tutor_id, student_id, title, description, due_at, link_url) VALUES (?,?,?,?,?,?,?)`,
    [enrollmentId, enr.tutor_id, enr.student_id, title, clean(req.body.description, 5000), dueAt, link]);
  res.status(201).json({ success: true, id: r.insertId });
}));

apiRouter.post('/homework/:id/submit', auth('student'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const hw = await queryOne<any>(`SELECT * FROM homework WHERE id = ? AND student_id = ?`, [id, me(req).sub]);
  if (!hw) return res.status(404).json({ error: 'Homework not found' });
  await execute(
    `INSERT INTO submissions (homework_id, text, file_url) VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE text=VALUES(text), file_url=VALUES(file_url), submitted_at=UTC_TIMESTAMP()`,
    [id, clean(req.body.text, 10000), clean(req.body.file_url, 500)]);
  res.json({ success: true });
}));

apiRouter.post('/homework/:id/grade', auth('admin', 'tutor'), wrap(async (req, res) => {
  const user = me(req);
  const id = Number(req.params.id);
  const hw = await queryOne<any>(`SELECT * FROM homework WHERE id = ?`, [id]);
  if (!hw) return res.status(404).json({ error: 'Homework not found' });
  if (user.role === 'tutor' && hw.tutor_id !== user.sub) return res.status(403).json({ error: 'Not your student' });
  const r = await execute(`UPDATE submissions SET grade = ?, feedback = ?, graded_at = UTC_TIMESTAMP() WHERE homework_id = ?`,
    [Number(req.body.grade), clean(req.body.feedback, 3000), id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'No submission yet' });
  res.json({ success: true });
}));

// ==========================================
// 9. INVOICES
// ==========================================
apiRouter.get('/invoices', auth('admin', 'student'), wrap(async (req, res) => {
  const s = scope(me(req), 'student_id', null);
  res.json(await query(`SELECT * FROM invoices WHERE ${s.sql} ORDER BY id DESC LIMIT 500`, s.params));
}));

apiRouter.post('/invoices', auth('admin'), wrap(async (req, res) => {
  const studentId = Number(req.body.student_id);
  const amount = Number(req.body.amount);
  if (!studentId || !(amount > 0)) return res.status(400).json({ error: 'student_id and a positive amount are required' });
  const reference = `INV-${new Date().getFullYear()}-${crypto.randomInt(10000, 99999)}`;
  const r = await execute(
    `INSERT INTO invoices (student_id, enrollment_id, description, amount, currency, due_date, status, reference)
     VALUES (?,?,?,?,?,?, 'pending', ?)`,
    [studentId, req.body.enrollment_id ? Number(req.body.enrollment_id) : null, clean(req.body.description),
     amount, clean(req.body.currency, 10) || 'INR', clean(req.body.due_date, 20), reference]);
  res.status(201).json({ success: true, id: r.insertId, reference });
}));

// Admin marks an invoice paid (after verifying UPI/bank/Stripe payment)
apiRouter.post('/invoices/:id/pay', auth('admin'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const r = await execute(
    `UPDATE invoices SET status='paid', paid_at=UTC_TIMESTAMP(), method=? WHERE id = ? AND status <> 'paid'`,
    [clean(req.body.method, 50) || 'Manual', id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Invoice not found or already paid' });
  await audit(me(req).sub, 'mark_invoice_paid', 'invoices', id);
  res.json({ success: true, invoice: await queryOne(`SELECT * FROM invoices WHERE id = ?`, [id]) });
}));

// ==========================================
// 10. NOTIFICATIONS & OUTBOX
// ==========================================
apiRouter.get('/notifications', auth(), wrap(async (req, res) => {
  res.json(await query(`SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50`, [me(req).sub]));
}));

apiRouter.post('/notifications/:id/read', auth(), wrap(async (req, res) => {
  await execute(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [Number(req.params.id), me(req).sub]);
  res.json({ success: true });
}));

apiRouter.get('/outbox', auth('admin'), wrap(async (_req, res) => {
  res.json(await query(`SELECT * FROM outbox ORDER BY id DESC LIMIT 200`));
}));

// ==========================================
// 12. QUIZZES (admin & tutor create + assign; students take assigned quizzes)
// ==========================================
// Which students may this user assign to? admin: anyone, tutor: only own enrolled students.
async function allowedStudentIds(user: AuthUser, ids: number[]): Promise<number[]> {
  const uniq = [...new Set(ids.filter(n => Number.isInteger(n) && n > 0))];
  if (!uniq.length) return [];
  const ph = uniq.map(() => '?').join(',');
  if (user.role === 'admin') {
    const rows = await query<any>(`SELECT id FROM users WHERE role='student' AND active=1 AND id IN (${ph})`, uniq);
    return rows.map(r => r.id);
  }
  const rows = await query<any>(
    `SELECT DISTINCT student_id AS id FROM enrollments WHERE tutor_id = ? AND student_id IN (${ph})`, [user.sub, ...uniq]);
  return rows.map(r => r.id);
}

async function assignQuiz(quizId: number, studentIds: number[], by: AuthUser, dueAt: Date | null, title: string) {
  for (const sid of studentIds) {
    const r = await execute(
      `INSERT IGNORE INTO quiz_assignments (quiz_id, student_id, assigned_by, due_at) VALUES (?,?,?,?)`,
      [quizId, sid, by.sub, dueAt]);
    if (r.affectedRows) {
      await execute(`INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)`,
        [sid, 'New quiz assigned', `Quiz "${title}" has been assigned to you. Open your dashboard to attempt it.`]).catch(() => undefined);
    }
  }
}

apiRouter.get('/quizzes', auth(), wrap(async (req, res) => {
  const user = me(req);
  if (user.role === 'student') {
    return res.json(await query(
      `SELECT q.id, q.title, q.created_at, a.due_at, a.created_at AS assigned_at, u.name AS assigned_by_name,
              (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count,
              (SELECT score FROM quiz_attempts WHERE quiz_id = q.id AND student_id = a.student_id ORDER BY id DESC LIMIT 1) AS score,
              (SELECT taken_at FROM quiz_attempts WHERE quiz_id = q.id AND student_id = a.student_id ORDER BY id DESC LIMIT 1) AS taken_at
       FROM quiz_assignments a JOIN quizzes q ON q.id = a.quiz_id JOIN users u ON u.id = a.assigned_by
       WHERE a.student_id = ? ORDER BY a.id DESC`, [user.sub]));
  }
  // admin sees all quizzes; tutor sees own + admin-created quizzes
  const where = user.role === 'admin' ? '1=1' : `(q.created_by = ? OR cu.role = 'admin')`;
  const params = user.role === 'admin' ? [] : [user.sub];
  res.json(await query(
    `SELECT q.id, q.title, q.created_by, q.created_at, cu.name AS created_by_name,
            (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count,
            (SELECT COUNT(*) FROM quiz_assignments WHERE quiz_id = q.id) AS assigned_count,
            (SELECT COUNT(DISTINCT student_id) FROM quiz_attempts WHERE quiz_id = q.id) AS attempted_count
     FROM quizzes q JOIN users cu ON cu.id = q.created_by WHERE ${where} ORDER BY q.id DESC LIMIT 300`, params));
}));

apiRouter.post('/quizzes', auth('admin', 'tutor'), wrap(async (req, res) => {
  const user = me(req);
  const title = clean(req.body.title);
  const questions = Array.isArray(req.body.questions) ? req.body.questions : [];
  if (!title) return res.status(400).json({ error: 'Quiz title is required' });
  if (!questions.length) return res.status(400).json({ error: 'Add at least one question' });
  if (questions.length > 100) return res.status(400).json({ error: 'Maximum 100 questions per quiz' });

  const cleaned: { question: string; options: string[]; correct: number }[] = [];
  for (const [i, qn] of questions.entries()) {
    const question = clean(qn?.question, 2000);
    const options = (Array.isArray(qn?.options) ? qn.options : []).map((o: any) => clean(o, 500)).filter(Boolean) as string[];
    const correct = Number(qn?.correct_option_index);
    if (!question) return res.status(400).json({ error: `Question ${i + 1}: text is required` });
    if (options.length < 2 || options.length > 6) return res.status(400).json({ error: `Question ${i + 1}: provide 2 to 6 options` });
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) return res.status(400).json({ error: `Question ${i + 1}: choose the correct option` });
    cleaned.push({ question, options, correct });
  }

  const quizId = await transaction(async conn => {
    const [q]: any = await conn.query(`INSERT INTO quizzes (title, created_by) VALUES (?,?)`, [title, user.sub]);
    for (const c of cleaned) {
      await conn.query(`INSERT INTO quiz_questions (quiz_id, question, options, correct_option_index) VALUES (?,?,?,?)`,
        [q.insertId, c.question, JSON.stringify(c.options), c.correct]);
    }
    return q.insertId as number;
  });

  // optional: assign right away
  let assigned = 0;
  if (Array.isArray(req.body.student_ids) && req.body.student_ids.length) {
    const ok = await allowedStudentIds(user, req.body.student_ids.map(Number));
    const due = req.body.due_at ? new Date(req.body.due_at) : null;
    await assignQuiz(quizId, ok, user, due && !isNaN(due.getTime()) ? due : null, title);
    assigned = ok.length;
  }
  await audit(user.sub, 'create_quiz', 'quizzes', quizId, { questions: cleaned.length, assigned });
  res.status(201).json({ success: true, id: quizId, assigned });
}));

apiRouter.post('/quizzes/:id/assign', auth('admin', 'tutor'), wrap(async (req, res) => {
  const user = me(req);
  const quizId = Number(req.params.id);
  const quiz = await queryOne<any>(
    `SELECT q.*, cu.role AS creator_role FROM quizzes q JOIN users cu ON cu.id = q.created_by WHERE q.id = ?`, [quizId]);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  if (user.role === 'tutor' && quiz.created_by !== user.sub && quiz.creator_role !== 'admin')
    return res.status(403).json({ error: 'You can only assign your own quizzes or admin quizzes' });
  const ids = Array.isArray(req.body.student_ids) ? req.body.student_ids.map(Number) : [];
  if (!ids.length) return res.status(400).json({ error: 'Select at least one student' });
  const ok = await allowedStudentIds(user, ids);
  if (!ok.length) return res.status(403).json({ error: 'None of the selected students can be assigned by you' });
  const due = req.body.due_at ? new Date(req.body.due_at) : null;
  await assignQuiz(quizId, ok, user, due && !isNaN(due.getTime()) ? due : null, quiz.title);
  await audit(user.sub, 'assign_quiz', 'quizzes', quizId, { students: ok.length });
  res.json({ success: true, assigned: ok.length, skipped: ids.length - ok.length });
}));

apiRouter.get('/quizzes/:id/questions', auth(), wrap(async (req, res) => {
  const user = me(req);
  const quizId = Number(req.params.id);
  if (user.role === 'student') {
    const a = await queryOne<any>(`SELECT id FROM quiz_assignments WHERE quiz_id = ? AND student_id = ?`, [quizId, user.sub]);
    if (!a) return res.status(403).json({ error: 'This quiz is not assigned to you' });
    // never reveal correct answers to students
    return res.json(await query(`SELECT id, quiz_id, question, options FROM quiz_questions WHERE quiz_id = ? ORDER BY id`, [quizId]));
  }
  res.json(await query(`SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY id`, [quizId]));
}));

apiRouter.get('/quizzes/:id/results', auth('admin', 'tutor'), wrap(async (req, res) => {
  const user = me(req);
  const quizId = Number(req.params.id);
  const extra = user.role === 'tutor'
    ? `AND a.student_id IN (SELECT student_id FROM enrollments WHERE tutor_id = ${Number(user.sub)})` : '';
  res.json(await query(
    `SELECT a.student_id, su.name AS student_name, a.due_at,
            (SELECT score FROM quiz_attempts t WHERE t.quiz_id = a.quiz_id AND t.student_id = a.student_id ORDER BY t.id DESC LIMIT 1) AS score,
            (SELECT taken_at FROM quiz_attempts t WHERE t.quiz_id = a.quiz_id AND t.student_id = a.student_id ORDER BY t.id DESC LIMIT 1) AS taken_at
     FROM quiz_assignments a JOIN users su ON su.id = a.student_id
     WHERE a.quiz_id = ? ${extra} ORDER BY su.name`, [quizId]));
}));

// Builds the per-question review (question, options, what the student picked, the right answer).
async function buildQuizReview(quizId: number, answers: Record<string, any>) {
  const rows = await query<any>(
    `SELECT id, question, options, correct_option_index FROM quiz_questions WHERE quiz_id = ? ORDER BY id`, [quizId]);
  return rows.map((q: any) => {
    const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
    const raw = answers ? answers[q.id] : undefined;
    const selected = (raw === null || raw === undefined || raw === '' || isNaN(Number(raw))) ? null : Number(raw);
    return {
      id: q.id,
      question: q.question,
      options,
      selected_index: selected,
      correct_index: Number(q.correct_option_index),
      is_correct: selected !== null && selected === Number(q.correct_option_index)
    };
  });
}

apiRouter.post('/quizzes/:id/submit', auth('student'), wrap(async (req, res) => {
  const user = me(req);
  const quizId = Number(req.params.id);
  const answers = (req.body.answers && typeof req.body.answers === 'object') ? req.body.answers : {};

  const a = await queryOne<any>(`SELECT id FROM quiz_assignments WHERE quiz_id = ? AND student_id = ?`, [quizId, user.sub]);
  if (!a) return res.status(403).json({ error: 'This quiz is not assigned to you' });
  const already = await queryOne<any>(`SELECT id FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?`, [quizId, user.sub]);
  if (already) return res.status(409).json({ error: 'You have already submitted this quiz' });

  const questions = await query<any>(`SELECT id, correct_option_index FROM quiz_questions WHERE quiz_id = ?`, [quizId]);
  if (!questions.length) return res.status(400).json({ error: 'This quiz has no questions' });
  let correct = 0;
  for (const q of questions) {
    if (Number(answers[q.id]) === q.correct_option_index && answers[q.id] !== null && answers[q.id] !== undefined) correct++;
  }
  const finalScore = Math.round((correct / questions.length) * 10000) / 100;
  await execute(`INSERT INTO quiz_attempts (quiz_id, student_id, score, answers) VALUES (?,?,?,?)`,
    [quizId, user.sub, finalScore, JSON.stringify(answers)]);
  // Result time: send the full review so the student sees which answer was right.
  res.json({ success: true, score: finalScore, correct, total: questions.length, review: await buildQuizReview(quizId, answers) });
}));

// Student: re-open the result of a quiz already submitted (answers + correct answers).
apiRouter.get('/quizzes/:id/review', auth('student'), wrap(async (req, res) => {
  const user = me(req);
  const quizId = Number(req.params.id);
  const attempt = await queryOne<any>(
    `SELECT score, answers FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? ORDER BY id DESC LIMIT 1`, [quizId, user.sub]);
  if (!attempt) return res.status(404).json({ error: 'You have not submitted this quiz yet' });
  let answers: Record<string, any> = {};
  try { answers = attempt.answers ? (typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : attempt.answers) : {}; } catch { answers = {}; }
  const review = await buildQuizReview(quizId, answers);
  const correct = review.filter((r: any) => r.is_correct).length;
  res.json({ score: Number(attempt.score), correct, total: review.length, review, answers_saved: !!attempt.answers });
}));

apiRouter.get('/resources', auth(), wrap(async (req, res) => {
  const user = me(req);
  if (user.role === 'admin') {
    res.json(await query(`SELECT r.*, u.name as tutor_name FROM resources r JOIN users u ON u.id = r.tutor_id ORDER BY r.id DESC`));
  } else if (user.role === 'tutor') {
    res.json(await query(`SELECT * FROM resources WHERE tutor_id = ? ORDER BY id DESC`, [user.sub]));
  } else {
    // Students see resources for their enrolled courses
    res.json(await query(`
      SELECT r.*, u.name as tutor_name FROM resources r
      JOIN users u ON u.id = r.tutor_id
      WHERE EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = ? AND e.status='active'
                    AND e.course_id = r.course_id AND e.tutor_id = r.tutor_id)
      ORDER BY r.id DESC`, [user.sub]));
  }
}));

apiRouter.post('/resources', auth('admin', 'tutor'), wrap(async (req, res) => {
  const user = me(req);
  const title = clean(req.body.title);
  const url = cleanUrl(req.body.file_url);
  const courseId = Number(req.body.course_id);
  if (!title) return res.status(400).json({ error: 'Title is required' });
  if (!url) return res.status(400).json({ error: 'A valid link (https://...) is required' });
  if (!courseId) return res.status(400).json({ error: 'Select the course these notes are for' });
  const tutorId = user.role === 'tutor' ? user.sub : (Number(req.body.tutor_id) || user.sub);
  if (user.role === 'tutor') {
    const ok = await queryOne<any>(`SELECT id FROM enrollments WHERE tutor_id = ? AND course_id = ? LIMIT 1`, [user.sub, courseId]);
    if (!ok) return res.status(403).json({ error: 'You do not teach this course' });
  }
  const r = await execute(
    `INSERT INTO resources (tutor_id, course_id, title, file_url, description) VALUES (?,?,?,?,?)`,
    [tutorId, courseId, title, url, clean(req.body.description, 5000)]);
  const students = await query<any>(`SELECT DISTINCT student_id FROM enrollments WHERE tutor_id = ? AND course_id = ? AND status='active'`, [tutorId, courseId]);
  for (const st of students) {
    await execute(`INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)`,
      [st.student_id, 'New study material', `"${title}" has been added to your study materials.`]).catch(() => undefined);
  }
  res.status(201).json({ success: true, id: r.insertId });
}));

apiRouter.post('/attendance', auth('admin', 'tutor'), wrap(async (req, res) => {
  const user = me(req);
  const { session_id, student_id, status } = req.body;
  if (!session_id || !student_id || !status) return res.status(400).json({ error: 'Missing required fields' });

  await execute(
    `INSERT INTO attendance (session_id, student_id, status, marked_by) VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE status=VALUES(status), marked_by=VALUES(marked_by)`,
    [Number(session_id), Number(student_id), status, user.sub]);
  res.json({ success: true });
}));

apiRouter.get('/attendance/:sessionId', auth(), wrap(async (req, res) => {
  res.json(await query(`SELECT * FROM attendance WHERE session_id = ?`, [Number(req.params.sessionId)]));
}));

apiRouter.get('/doubts', auth(), wrap(async (req, res) => {
  const user = me(req);
  const s = scope(user, 'student_id', 'tutor_id');
  res.json(await query(`
    SELECT d.*, s.name as student_name, t.name as tutor_name
    FROM doubts d
    JOIN users s ON s.id = d.student_id
    LEFT JOIN users t ON t.id = d.tutor_id
    WHERE ${s.sql} ORDER BY d.id DESC`, s.params));
}));

apiRouter.post('/doubts', auth('student'), wrap(async (req, res) => {
  const user = me(req);
  const question = clean(req.body.question, 10000);
  const enrollmentId = Number(req.body.enrollment_id);
  if (!question) return res.status(400).json({ error: 'Question is required' });
  if (!enrollmentId) return res.status(400).json({ error: 'Select the course / tutor for this doubt' });
  const enr = await queryOne<any>(`SELECT tutor_id FROM enrollments WHERE id = ? AND student_id = ?`, [enrollmentId, user.sub]);
  if (!enr) return res.status(403).json({ error: 'This is not your enrollment' });
  const r = await execute(
    `INSERT INTO doubts (student_id, tutor_id, enrollment_id, question) VALUES (?,?,?,?)`,
    [user.sub, enr.tutor_id, enrollmentId, question]);
  await execute(`INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)`,
    [enr.tutor_id, 'New doubt from student', `${user.name} asked a doubt. Open your dashboard to reply.`]).catch(() => undefined);
  res.status(201).json({ success: true, id: r.insertId });
}));

apiRouter.post('/doubts/:id/answer', auth('admin', 'tutor'), wrap(async (req, res) => {
  const user = me(req);
  const { answer } = req.body;
  if (!answer) return res.status(400).json({ error: 'Answer is required' });

  const d = await queryOne<any>(`SELECT * FROM doubts WHERE id = ?`, [Number(req.params.id)]);
  if (!d) return res.status(404).json({ error: 'Doubt not found' });
  if (user.role === 'tutor' && d.tutor_id && d.tutor_id !== user.sub) return res.status(403).json({ error: 'Not assigned to you' });

  await execute(
    `UPDATE doubts SET answer = ?, status = 'answered', tutor_id = COALESCE(tutor_id, ?), updated_at = UTC_TIMESTAMP() WHERE id = ?`,
    [clean(answer, 10000), user.sub, Number(req.params.id)]);
  await execute(`INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)`,
    [d.student_id, 'Your doubt was answered', 'Your tutor replied to your doubt. Open your dashboard to read it.']).catch(() => undefined);
  res.json({ success: true });
}));

// Admin: who did what (latest 300 actions)
// ==========================================
// PERMANENT ASSIGNMENT LINK (admin only)
// One fixed link per student + teacher + course. It never expires with a class; the student and the tutor
// always see it, and it is included in every Google Calendar event of that enrollment.
// ==========================================
apiRouter.patch('/enrollments/:id/assignment-link', auth('admin'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const enr = await queryOne<any>(`SELECT * FROM enrollments WHERE id = ?`, [id]);
  if (!enr) return res.status(404).json({ error: 'Enrollment not found' });
  const raw = clean(req.body.assignment_link, 500);
  const val = raw ? cleanUrl(raw) : null;
  if (raw && !val) return res.status(400).json({ error: 'Assignment link must be a valid http(s) link' });
  await execute(`UPDATE enrollments SET assignment_link = ? WHERE id = ?`, [val, id]);
  if (val && val !== enr.assignment_link) {
    for (const uid of [enr.student_id, enr.tutor_id]) {
      await execute(`INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)`,
        [uid, 'Assignment link added', 'A permanent assignment link is now available on your dashboard.']).catch(() => undefined);
    }
  }
  await audit(me(req).sub, 'set_assignment_link', 'enrollments', id);
  res.json({ success: true, assignment_link: val });
}));

// ==========================================
// TOPICS COVERED
// ONLY the tutor can add (or remove) a topic. Student, tutor and admin can read it (each sees their own scope).
// ==========================================
apiRouter.get('/topics', auth(), wrap(async (req, res) => {
  const s = scope(me(req), 't.student_id', 't.tutor_id');
  res.json(await query(
    `SELECT t.*, su.name AS student_name, tu.name AS tutor_name
     FROM topic_progress t JOIN users su ON su.id = t.student_id JOIN users tu ON tu.id = t.tutor_id
     WHERE ${s.sql} ORDER BY t.covered_on DESC, t.id DESC LIMIT 1000`, s.params));
}));

apiRouter.post('/topics', auth('tutor'), wrap(async (req, res) => {
  const user = me(req);
  const enr = await queryOne<any>(
    `SELECT e.*, c.title AS course_title FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.id = ?`,
    [Number(req.body.enrollment_id)]);
  if (!enr) return res.status(404).json({ error: 'Select a student first' });
  if (enr.tutor_id !== user.sub) return res.status(403).json({ error: 'This is not your student' });
  const topic = clean(req.body.topic, 255);
  if (!topic) return res.status(400).json({ error: 'Topic is required' });
  const subject = clean(req.body.subject, 150) || enr.course_title;
  const d = req.body.covered_on ? new Date(req.body.covered_on) : new Date();
  const day = (isNaN(d.getTime()) ? new Date() : d).toISOString().slice(0, 10);
  let sessionId: number | null = null;
  if (req.body.session_id) {
    const ss = await queryOne<any>(`SELECT id FROM sessions WHERE id = ? AND tutor_id = ? AND student_id = ?`, [Number(req.body.session_id), user.sub, enr.student_id]);
    sessionId = ss ? ss.id : null;
  }
  const r = await execute(
    `INSERT INTO topic_progress (enrollment_id, session_id, student_id, tutor_id, subject, topic, note, covered_on) VALUES (?,?,?,?,?,?,?,?)`,
    [enr.id, sessionId, enr.student_id, user.sub, subject, topic, clean(req.body.note, 500), day]);
  await execute(`INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)`,
    [enr.student_id, 'Topic completed', `${subject}: "${topic}" was covered in class.`]).catch(() => undefined);
  res.status(201).json({ success: true, id: r.insertId });
}));

apiRouter.delete('/topics/:id', auth('tutor'), wrap(async (req, res) => {
  const r = await execute(`DELETE FROM topic_progress WHERE id = ? AND tutor_id = ?`, [Number(req.params.id), me(req).sub]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Topic not found' });
  res.json({ success: true });
}));

// ==========================================
// GOOGLE CALENDAR FEED (iCalendar / .ics)
// Each user gets a private secret URL. Subscribing to it in Google Calendar ("Add calendar -> From URL") shows
// every class (date, time, student, tutor, links), homework due dates and topics covered, and picks up
// reschedules / cancellations automatically.
//   admin   -> classes of ALL students and tutors
//   tutor   -> own classes     student -> own classes
// ==========================================
const icsEscape = (v: any) => String(v ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const icsFold = (line: string) => {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 73) {
    let cut = 73;
    while (Buffer.byteLength(rest.slice(0, cut)) > 73) cut--;
    out.push(rest.slice(0, cut)); rest = ' ' + rest.slice(cut);
  }
  out.push(rest);
  return out.join('\r\n');
};
const icsDate = (d: any) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

async function ensureCalendarToken(userId: number): Promise<string> {
  const u = await queryOne<any>(`SELECT calendar_token FROM users WHERE id = ?`, [userId]);
  if (u?.calendar_token) return u.calendar_token;
  const token = crypto.randomBytes(24).toString('hex');
  await execute(`UPDATE users SET calendar_token = ? WHERE id = ?`, [token, userId]);
  return token;
}

apiRouter.get('/calendar/info', auth(), wrap(async (req, res) => {
  res.json({ token: await ensureCalendarToken(me(req).sub), path: null });
}));

// Generates a NEW secret link (the old one stops working)
apiRouter.post('/calendar/reset', auth(), wrap(async (req, res) => {
  const token = crypto.randomBytes(24).toString('hex');
  await execute(`UPDATE users SET calendar_token = ? WHERE id = ?`, [token, me(req).sub]);
  res.json({ token });
}));

apiRouter.get('/calendar/:file', wrap(async (req, res) => {
  const m = /^([a-f0-9]{48})\.ics$/.exec(String(req.params.file));
  if (!m) return res.status(404).send('Not found');
  const user = await queryOne<any>(`SELECT id, role, name, active FROM users WHERE calendar_token = ?`, [m[1]]);
  if (!user || !user.active) return res.status(404).send('Not found');

  const sc = scope({ sub: user.id, role: user.role } as AuthUser, 's.student_id', 's.tutor_id');
  const sessions = await query<any>(
    `SELECT s.*, su.name AS student_name, tu.name AS tutor_name, e.assignment_link, c.title AS course_title
     FROM sessions s JOIN users su ON su.id = s.student_id JOIN users tu ON tu.id = s.tutor_id
     LEFT JOIN enrollments e ON e.id = s.enrollment_id LEFT JOIN courses c ON c.id = e.course_id
     WHERE ${sc.sql} AND s.starts_at > (UTC_TIMESTAMP() - INTERVAL 90 DAY) ORDER BY s.starts_at LIMIT 2000`, sc.params);
  const hsc = scope({ sub: user.id, role: user.role } as AuthUser, 'h.student_id', 'h.tutor_id');
  const homework = await query<any>(
    `SELECT h.*, su.name AS student_name FROM homework h JOIN users su ON su.id = h.student_id
     WHERE ${hsc.sql} AND h.due_at IS NOT NULL AND h.due_at > (UTC_TIMESTAMP() - INTERVAL 90 DAY) LIMIT 2000`, hsc.params);
  const tsc = scope({ sub: user.id, role: user.role } as AuthUser, 't.student_id', 't.tutor_id');
  const topics = await query<any>(
    `SELECT t.session_id, t.subject, t.topic FROM topic_progress t WHERE ${tsc.sql} AND t.session_id IS NOT NULL`, tsc.params);
  const topicsBySession = new Map<number, string[]>();
  for (const t of topics) topicsBySession.set(t.session_id, [...(topicsBySession.get(t.session_id) || []), `${t.subject}: ${t.topic}`]);

  const stamp = icsDate(new Date());
  const L: string[] = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tutor Monk//Class Calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(user.role === 'admin' ? 'Tutor Monk - All classes' : 'Tutor Monk classes')}`,
    'X-WR-TIMEZONE:Asia/Kolkata', 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H'
  ];
  for (const s of sessions) {
    const who = user.role === 'admin' ? `${s.student_name} with ${s.tutor_name}` : user.role === 'tutor' ? s.student_name : s.tutor_name;
    const desc: string[] = [`Student: ${s.student_name}`, `Tutor: ${s.tutor_name}`];
    if (s.course_title) desc.push(`Subject: ${s.course_title}`);
    if (s.meet_link) desc.push(`Google Meet: ${s.meet_link}`);
    else if (s.meeting_url) desc.push(`Join: ${s.meeting_url}`);
    if (s.whiteboard_link) desc.push(`Whiteboard: ${s.whiteboard_link}`);
    if (s.assignment_link) desc.push(`Assignment link: ${s.assignment_link}`);
    if (s.rescheduled && s.original_starts_at) desc.push(`Rescheduled from ${fmtIST(s.original_starts_at)}`);
    const tp = topicsBySession.get(s.id);
    if (tp?.length) desc.push(`Topics covered: ${tp.join('; ')}`);
    const cancelled = s.status === 'cancelled';
    L.push('BEGIN:VEVENT',
      `UID:session-${s.id}@tutormonk`, `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(s.starts_at)}`, `DTEND:${icsDate(s.ends_at)}`,
      `SUMMARY:${icsEscape(`${cancelled ? '[Cancelled] ' : ''}${s.title || 'Class'} - ${who}`)}`,
      `DESCRIPTION:${icsEscape(desc.join('\n'))}`,
      `STATUS:${cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
      `SEQUENCE:${s.rescheduled ? Math.floor(new Date(s.starts_at).getTime() / 60000) % 100000 : 0}`);
    const url = s.meet_link || s.meeting_url;
    if (url) L.push(`URL:${icsEscape(url)}`);
    L.push('END:VEVENT');
  }
  for (const h of homework) {
    const due = new Date(h.due_at);
    const desc = [h.description, h.link_url ? `Homework link: ${h.link_url}` : null, `Student: ${h.student_name}`].filter(Boolean).join('\n');
    L.push('BEGIN:VEVENT', `UID:homework-${h.id}@tutormonk`, `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(new Date(due.getTime() - 30 * 60000))}`, `DTEND:${icsDate(due)}`,
      `SUMMARY:${icsEscape(`Homework due: ${h.title}${user.role !== 'student' ? ` - ${h.student_name}` : ''}`)}`,
      `DESCRIPTION:${icsEscape(desc)}`, 'END:VEVENT');
  }
  L.push('END:VCALENDAR');
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="tutormonk.ics"');
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.send(L.map(icsFold).join('\r\n') + '\r\n');
}));

apiRouter.get('/audit-logs', auth('admin'), wrap(async (_req, res) => {
  res.json(await query(
    `SELECT a.id, a.action, a.entity, a.entity_id, a.meta, a.created_at, u.name AS user_name, u.role AS user_role
     FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 300`));
}));

// ==========================================
// 99. ADMIN DELETE CENTER (admin can delete anything)
// ==========================================
interface DeletableEntity {
  label: string;
  table: string;
  joins?: string;
  where?: string;          // optional filter on alias t (e.g. role)
  title: string;           // SQL expr -> title
  sub: string;             // SQL expr -> subtitle
  ts: string;              // timestamp column on t
  before?: (conn: any, ids: number[]) => Promise<void>; // clean-up that FKs would block / leave orphaned
}

const delSessionsOfEnrollments = async (conn: any, enrollmentIds: number[]) => {
  if (!enrollmentIds.length) return;
  await conn.query(`DELETE FROM sessions WHERE enrollment_id IN (?)`, [enrollmentIds]);
  await conn.query(`DELETE FROM session_series WHERE enrollment_id IN (?)`, [enrollmentIds]);
};

const DELETABLE: Record<string, DeletableEntity> = {
  students: { label: 'Students', table: 'users', where: `t.role = 'student'`, title: 't.name', sub: 't.email', ts: 'created_at' },
  tutors: { label: 'Tutors', table: 'users', where: `t.role = 'tutor'`, title: 't.name', sub: 't.email', ts: 'created_at' },
  admins: { label: 'Admins (other than you)', table: 'users', where: `t.role = 'admin'`, title: 't.name', sub: 't.email', ts: 'created_at' },
  courses: {
    label: 'Courses', table: 'courses', title: 't.title', sub: `CONCAT_WS(' • ', t.country, t.category, t.grade_band)`, ts: 'id',
    before: async (conn, ids) => {
      const enr: any[] = (await conn.query(`SELECT id FROM enrollments WHERE course_id IN (?)`, [ids]))[0];
      const eids = enr.map(e => e.id);
      await delSessionsOfEnrollments(conn, eids);
      if (eids.length) await conn.query(`DELETE FROM enrollments WHERE id IN (?)`, [eids]);
    }
  },
  enrollments: {
    label: 'Enrollments', table: 'enrollments',
    joins: `JOIN users s ON s.id = t.student_id JOIN users tu ON tu.id = t.tutor_id JOIN courses c ON c.id = t.course_id`,
    title: `CONCAT(s.name, ' \u2192 ', c.title)`, sub: `CONCAT('Tutor: ', tu.name, ' \u2022 ', t.status)`, ts: 'created_at',
    before: (conn, ids) => delSessionsOfEnrollments(conn, ids)
  },
  sessions: {
    label: 'Classes / Sessions', table: 'sessions',
    joins: `JOIN users s ON s.id = t.student_id JOIN users tu ON tu.id = t.tutor_id`,
    title: `COALESCE(t.title, 'Class')`, sub: `CONCAT(s.name, ' with ', tu.name, ' \u2022 ', t.starts_at, ' \u2022 ', t.status)`, ts: 'created_at'
  },
  session_series: {
    label: 'Recurring class series', table: 'session_series',
    joins: `JOIN users s ON s.id = t.student_id JOIN users tu ON tu.id = t.tutor_id`,
    title: `COALESCE(t.title, 'Series')`, sub: `CONCAT(s.name, ' with ', tu.name)`, ts: 'created_at',
    before: async (conn, ids) => { await conn.query(`DELETE FROM sessions WHERE series_id IN (?)`, [ids]); }
  },
  homework: {
    label: 'Homework (and submissions)', table: 'homework', joins: `JOIN users s ON s.id = t.student_id`,
    title: 't.title', sub: `CONCAT('Student: ', s.name)`, ts: 'created_at'
  },
  quizzes: {
    label: 'Quizzes (questions, assignments and results)', table: 'quizzes',
    title: 't.title', sub: `CONCAT((SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = t.id), ' questions')`, ts: 'created_at'
  },
  quiz_results: {
    label: 'Quiz results (student can retake after delete)', table: 'quiz_attempts',
    joins: `JOIN users s ON s.id = t.student_id JOIN quizzes q ON q.id = t.quiz_id`,
    title: `CONCAT(s.name, ' \u2014 ', q.title)`, sub: `CONCAT(t.score, '%')`, ts: 'taken_at'
  },
  quiz_assignments: {
    label: 'Quiz assignments', table: 'quiz_assignments',
    joins: `JOIN users s ON s.id = t.student_id JOIN quizzes q ON q.id = t.quiz_id`,
    title: `CONCAT(s.name, ' \u2014 ', q.title)`, sub: `COALESCE(CONCAT('Due ', t.due_at), 'No due date')`, ts: 'created_at'
  },
  tests: { label: 'Tests', table: 'tests', title: 't.title', sub: `CONCAT_WS(' \u2022 ', t.subject, t.grade)`, ts: 'created_at' },
  test_results: {
    label: 'Test results', table: 'test_results',
    joins: `JOIN users s ON s.id = t.student_id JOIN tests x ON x.id = t.test_id`,
    title: `CONCAT(s.name, ' \u2014 ', x.title)`, sub: `CONCAT('Score ', t.score)`, ts: 'taken_at'
  },
  reports: {
    label: 'Progress reports', table: 'reports', joins: `JOIN users s ON s.id = t.student_id`,
    title: `CONCAT(s.name, ' \u2014 ', COALESCE(t.period, 'Report'))`, sub: `LEFT(t.summary, 80)`, ts: 'created_at'
  },
  feedback: {
    label: 'Class feedback / ratings', table: 'feedback', joins: `JOIN users u ON u.id = t.from_user`,
    title: `CONCAT(u.name, ' \u2014 ', t.rating, '/5')`, sub: `COALESCE(LEFT(t.comment, 80), '')`, ts: 'created_at'
  },
  class_remarks: {
    label: 'Class remarks', table: 'class_remarks', joins: `JOIN users s ON s.id = t.student_id`,
    title: `CONCAT(s.name, ' \u2014 remark')`, sub: `LEFT(t.remark, 80)`, ts: 'created_at'
  },
  attendance: {
    label: 'Attendance records', table: 'attendance', joins: `JOIN users s ON s.id = t.student_id`,
    title: 's.name', sub: `CONCAT(t.status, ' \u2022 session #', t.session_id)`, ts: 'created_at'
  },
  resources: { label: 'Study resources', table: 'resources', title: 't.title', sub: 't.file_url', ts: 'created_at' },
  doubts: {
    label: 'Doubts', table: 'doubts', joins: `JOIN users s ON s.id = t.student_id`,
    title: `LEFT(t.question, 80)`, sub: `CONCAT(s.name, ' \u2022 ', t.status)`, ts: 'created_at'
  },
  invoices: {
    label: 'Invoices / payments', table: 'invoices', joins: `JOIN users s ON s.id = t.student_id`,
    title: `CONCAT(s.name, ' \u2014 ', t.amount, ' ', t.currency)`, sub: `CONCAT_WS(' \u2022 ', t.description, t.status)`, ts: 'created_at'
  },
  payouts: {
    label: 'Tutor payouts', table: 'payouts', joins: `JOIN users tu ON tu.id = t.tutor_id`,
    title: `CONCAT(tu.name, ' \u2014 ', t.amount, ' ', t.currency)`, sub: `CONCAT(t.period_start, ' to ', t.period_end, ' \u2022 ', t.status)`, ts: 'created_at'
  },
  leads: { label: 'Demo bookings / leads', table: 'leads', title: `COALESCE(t.student_name, t.name)`, sub: `CONCAT_WS(' \u2022 ', t.phone, t.email, t.status)`, ts: 'created_at' },
  tutor_applications: { label: 'Tutor applications', table: 'tutor_applications', title: 't.name', sub: `CONCAT_WS(' \u2022 ', t.email, t.status)`, ts: 'created_at' },
  announcements: { label: 'Announcements', table: 'announcements', title: 't.title', sub: `CONCAT('For: ', t.audience)`, ts: 'created_at' },
  notifications: {
    label: 'Notifications', table: 'notifications', joins: `JOIN users u ON u.id = t.user_id`,
    title: 't.title', sub: `CONCAT('To: ', u.name)`, ts: 'created_at'
  },
  outbox: { label: 'Email / WhatsApp outbox', table: 'outbox', title: `COALESCE(t.subject, LEFT(t.body, 60))`, sub: `CONCAT(t.channel, ' \u2022 ', t.to_addr, ' \u2022 ', t.status)`, ts: 'created_at' },
  audit_log: { label: 'Audit log', table: 'audit_log', title: 't.action', sub: `CONCAT_WS(' #', t.entity, t.entity_id)`, ts: 'created_at' }
};

const entityOr404 = (key: string, res: Response): DeletableEntity | null => {
  const e = Object.prototype.hasOwnProperty.call(DELETABLE, key) ? DELETABLE[key] : null;
  if (!e) res.status(404).json({ error: 'Unknown data type' });
  return e;
};
const entFrom = (e: DeletableEntity, selfId: number) => {
  const wh = [e.where, e.table === 'users' ? `t.id <> ${Number(selfId)}` : null].filter(Boolean).join(' AND ') || '1=1';
  return `FROM \`${e.table}\` t ${e.joins || ''} WHERE ${wh}`;
};

async function deleteIds(e: DeletableEntity, ids: number[]) {
  if (!ids.length) return 0;
  return transaction(async conn => {
    if (e.before) await e.before(conn, ids);
    const [r]: any = await conn.query(`DELETE FROM \`${e.table}\` WHERE id IN (?)`, [ids]);
    return Number(r.affectedRows) || 0;
  });
}

// Overview: every deletable data type with its count
apiRouter.get('/admin/records', auth('admin'), wrap(async (req, res) => {
  const selfId = me(req).sub;
  const out: any[] = [];
  for (const [key, e] of Object.entries(DELETABLE)) {
    let count = 0;
    try { count = Number((await queryOne<any>(`SELECT COUNT(*) AS c ${entFrom(e, selfId)}`))?.c) || 0; } catch { /* table may not exist yet */ }
    out.push({ key, label: e.label, count });
  }
  res.json(out);
}));

apiRouter.get('/admin/records/:entity', auth('admin'), wrap(async (req, res) => {
  const e = entityOr404(String(req.params.entity), res); if (!e) return;
  const rows = await query(
    `SELECT t.id, ${e.title} AS title, ${e.sub} AS sub, t.\`${e.ts}\` AS created_at ${entFrom(e, me(req).sub)} ORDER BY t.id DESC LIMIT 500`);
  res.json(rows);
}));

apiRouter.delete('/admin/records/:entity/:id', auth('admin'), wrap(async (req, res) => {
  const e = entityOr404(String(req.params.entity), res); if (!e) return;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  if (e.table === 'users' && id === me(req).sub) return res.status(400).json({ error: 'You cannot delete your own account' });
  const n = await deleteIds(e, [id]);
  if (!n) return res.status(404).json({ error: 'Item not found (maybe already deleted)' });
  await audit(me(req).sub, 'admin_delete', String(req.params.entity), id);
  res.json({ success: true, deleted: n });
}));

// Delete several selected items, or everything of this type
apiRouter.post('/admin/records/:entity/delete-many', auth('admin'), wrap(async (req, res) => {
  const key = String(req.params.entity);
  const e = entityOr404(key, res); if (!e) return;
  let ids: number[];
  if (req.body.all === true) {
    if (req.body.confirm !== 'DELETE') return res.status(400).json({ error: 'Type DELETE to confirm' });
    ids = (await query<any>(`SELECT t.id ${entFrom(e, me(req).sub)}`)).map(r => Number(r.id));
  } else {
    ids = (Array.isArray(req.body.ids) ? req.body.ids : []).map(Number).filter((n: number) => Number.isInteger(n));
    if (e.table === 'users') ids = ids.filter(i => i !== me(req).sub);
  }
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 500) deleted += await deleteIds(e, ids.slice(i, i + 500));
  await audit(me(req).sub, req.body.all === true ? 'admin_delete_all' : 'admin_delete_many', key, null, { deleted });
  res.json({ success: true, deleted });
}));

// Admin: delete one student's result for a quiz (all their attempts) so they can retake it
apiRouter.delete('/admin/quizzes/:quizId/results/:studentId', auth('admin'), wrap(async (req, res) => {
  const r = await execute(`DELETE FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?`, [Number(req.params.quizId), Number(req.params.studentId)]);
  await audit(me(req).sub, 'admin_delete_quiz_result', 'quizzes', Number(req.params.quizId), { student: Number(req.params.studentId) });
  res.json({ success: true, deleted: r.affectedRows });
}));
