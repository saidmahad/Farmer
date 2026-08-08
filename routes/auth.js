// routes/auth.js
// POST /api/register  - create a new user, passwords hashed with bcrypt
// POST /api/login      - verify credentials, issue a JWT
// GET  /api/me         - return the current user's profile (requires auth)
//
// Profile fields beyond name/email (region, land_size, farm_type, language)
// are persisted on the users table by migration 001. They are optional at
// signup so a single-step quick-register still works, and the Figma-style
// multi-step form can append them as the user progresses.

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const db = require('../db');
const { validateRegistration, validateLogin } = require('../utils/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
const SALT_ROUNDS = 12;

// Allowed values for the new profile fields. Anything outside these sets
// is rejected silently (treated as null) so a tampered client can't slip
// in unexpected values into the JWT/logs.
const FARM_TYPES = new Set(['Subsistence', 'Commercial', 'Mixed', 'Organic']);
const ROLES = new Set(['farmer', 'admin']);
const LANGS = new Set(['en', 'so', 'ar']);

function coerceProfile(input) {
  const out = { region: null, land_size: null, farm_type: null, language: null, role: 'farmer' };
  if (!input || typeof input !== 'object') return out;

  if (typeof input.region === 'string') {
    const r = input.region.trim().slice(0, 80);
    out.region = r.length ? r : null;
  }
  if (input.land_size != null && input.land_size !== '') {
    const n = Number(input.land_size);
    if (Number.isFinite(n) && n >= 0 && n <= 100000) {
      out.land_size = n;
    }
  }
  if (typeof input.farm_type === 'string' && FARM_TYPES.has(input.farm_type)) {
    out.farm_type = input.farm_type;
  }
  if (typeof input.language === 'string' && LANGS.has(input.language)) {
    out.language = input.language;
  }
  if (typeof input.role === 'string' && ROLES.has(input.role)) {
    out.role = input.role;
  }
  return out;
}

// Column existence check so the route still works on a DB that hasn't
// been migrated yet (e.g. right after fresh clone, before 001 runs).
function userColumns(db) {
  return new Set(db.prepare('PRAGMA table_info(users)').all().map((c) => c.name));
}

function buildUserPayload(row) {
  const cols = row || {};
  return {
    id: cols.id,
    name: cols.name,
    email: cols.email,
    region: cols.region ?? null,
    land_size: cols.land_size ?? null,
    farm_type: cols.farm_type ?? null,
    language: cols.language ?? null,
    role: cols.role ?? 'farmer',
  };
}

// Throttle auth endpoints to slow down credential-stuffing / brute force.
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

  const cols = userColumns(db);
  const fields = ['name', 'email', 'password_hash'];
  const placeholders = ['?', '?', '?'];
  const values = [name.trim(), normalizedEmail, passwordHash];

  if (cols.has('region'))     { fields.push('region');     placeholders.push('?'); values.push(profile.region); }
  if (cols.has('land_size'))   { fields.push('land_size');   placeholders.push('?'); values.push(profile.land_size); }
  if (cols.has('farm_type'))   { fields.push('farm_type');   placeholders.push('?'); values.push(profile.farm_type); }
  if (cols.has('language'))    { fields.push('language');    placeholders.push('?'); values.push(profile.language); }
  if (cols.has('role'))        { fields.push('role');        placeholders.push('?'); values.push(profile.role); }

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

  // Same generic error whether the email is unknown or the password is
  // wrong, so we don't leak which accounts exist.
  const invalid = () => res.status(401).json({ error: 'Invalid email or password.' });

  if (!row) return invalid();

  const passwordOk = bcrypt.compareSync(password, row.password_hash);
  if (!passwordOk) return invalid();

  const user = buildUserPayload(row);
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return res.json({ token, user });
});

// Optional profile-completion endpoint — used by the Figma-style multi-step
// signup form when the user fills in their farm details after registering.
// Accepts a partial subset of fields and updates only what's sent.
router.patch('/me', requireAuth, (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

  const profile = coerceProfile(req.body || {});
  const cols = userColumns(db);

  const updates = [];
  const values = [];
  for (const [col, val] of [
    ['region', profile.region],
    ['land_size', profile.land_size],
    ['farm_type', profile.farm_type],
    ['language', profile.language],
  ]) {
    if (cols.has(col)) {
      updates.push(`${col} = ?`);
      values.push(val);
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'No updatable fields supplied.' });

  values.push(userId);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const user = buildUserPayload(row);
  // Re-issue a token so the client can pick up the new fields without
  // a separate login.
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