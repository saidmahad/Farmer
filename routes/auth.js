// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const db = require('../db');
const { validateRegistration, validateLogin } = require('../utils/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
const SALT_ROUNDS = 12;

const ROLES = new Set(['farmer', 'admin']);
const LANGS = new Set(['en', 'so', 'ar']);

// Otomaatig u sax kulumada database-ka SQLite
function ensureColumns(db) {
  let cols = new Set(db.prepare('PRAGMA table_info(users)').all().map((c) => c.name));
  const requiredCols = [
    ['region', 'TEXT'],
    ['language', 'TEXT DEFAULT "en"'],
    ['role', 'TEXT DEFAULT "farmer"']
  ];
  for (const [col, type] of requiredCols) {
    if (!cols.has(col)) {
      try {
        db.prepare(`ALTER TABLE users ADD COLUMN ${col} ${type}`).run();
        cols.add(col);
      } catch (e) {
        // Ignored if column already exists
      }
    }
  }
  return cols;
}

function coerceProfile(input) {
  const out = { region: null, language: 'en', role: 'farmer' };
  if (!input || typeof input !== 'object') return out;

  if (typeof input.region === 'string') {
    const r = input.region.trim().slice(0, 80);
    out.region = r.length ? r : null;
  }

  if (typeof input.language === 'string') {
    const lang = input.language.trim().toLowerCase();
    if (LANGS.has(lang)) {
      out.language = lang;
    }
  }

  if (typeof input.role === 'string' && ROLES.has(input.role.toLowerCase())) {
    out.role = input.role.toLowerCase();
  }
  return out;
}

function buildUserPayload(row) {
  const cols = row || {};
  return {
    id: cols.id,
    name: cols.name,
    email: cols.email,
    region: cols.region ?? null,
    language: cols.language ?? 'en',
    role: cols.role ?? 'farmer',
  };
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

router.post('/register', authLimiter, (req, res) => {
  const { name, email, password } = req.body || {};
  const errors = validateRegistration({ name, email, password });
  if (errors.length) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const profile = coerceProfile(req.body);

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  const cols = ensureColumns(db);

  const fields = ['name', 'email', 'password_hash'];
  const placeholders = ['?', '?', '?'];
  const values = [name.trim(), normalizedEmail, passwordHash];

  if (cols.has('region'))   { fields.push('region');   placeholders.push('?'); values.push(profile.region); }
  if (cols.has('language')) { fields.push('language'); placeholders.push('?'); values.push(profile.language); }
  if (cols.has('role'))     { fields.push('role');     placeholders.push('?'); values.push(profile.role); }

  const sql = `INSERT INTO users (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
  const result = db.prepare(sql).run(...values);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const user = buildUserPayload(row);
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return res.status(201).json({ token, user });
});

router.post('/login', authLimiter, (req, res) => {
  const { email, password } = req.body || {};
  const errors = validateLogin({ email, password });
  if (errors.length) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

  const invalid = () => res.status(401).json({ error: 'Invalid email or password.' });

  if (!row) return invalid();

  const passwordOk = bcrypt.compareSync(password, row.password_hash);
  if (!passwordOk) return invalid();

  const user = buildUserPayload(row);
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return res.json({ token, user });
});

router.patch('/me', requireAuth, (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

  const cols = ensureColumns(db);
  const profile = coerceProfile(req.body || {});

  const updates = [];
  const values = [];
  for (const [col, val] of [
    ['region', profile.region],
    ['language', profile.language],
  ]) {
    if (cols.has(col)) {
      updates.push(`${col} = ?`);
      values.push(val);
    }
  }

  if (!updates.length) {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!row) return res.status(404).json({ error: 'Account not found.' });
    const user = buildUserPayload(row);
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({ token, user });
  }

  values.push(userId);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const user = buildUserPayload(row);
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return res.json({ token, user });
});

router.get('/me', requireAuth, (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated.' });
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!row) return res.status(401).json({ error: 'Account not found.' });
  return res.json({ user: buildUserPayload(row) });
});

module.exports = router;