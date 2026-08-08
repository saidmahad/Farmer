// routes/subscriptions.js
// GET    /api/subscriptions - current user's subscription status + entitlements
// POST   /api/subscriptions - subscribe to a plan (MOCK — no real payment)
// DELETE /api/subscriptions - cancel the current subscription
//
// NOTE: The POST endpoint does NOT process any payment. It simply writes the
// subscription record so the rest of the app can demo entitlement gating.
// This is NOT PRODUCTION READY — integrate a real payment provider (and
// server-side entitlement enforcement) before shipping.

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const PLANS = new Set(['basic', 'premium']);
const ACTIVE_STATUS = 'active';

const FEATURES = {
  free: ['Limited crop advice', 'Basic crop catalog'],
  basic: [
    'Crop-specific planting advice',
    'Soil prediction tool',
    'Disease library',
    'Chatbot access',
    'Video tutorials',
  ],
  premium: [
    'Everything in Basic',
    'Advanced analytics & reports',
    'Priority support',
    'Offline access to guides',
  ],
};

// One month for basic, one year for premium. Stored via SQLite datetime()
// helpers so the value is consistent with started_at / created_at formats.
const PLAN_DURATION = { basic: '+30 days', premium: '+365 days' };

function isActive(row) {
  if (!row) return false;
  if (row.status !== ACTIVE_STATUS) return false;
  // Expired once expires_at is in the past.
  if (row.expires_at) {
    const expiry = new Date(row.expires_at);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() <= Date.now()) return false;
  }
  return true;
}

function subscriptionRow(userId) {
  return db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId);
}

router.get('/', requireAuth, (req, res) => {
  const row = subscriptionRow(req.user.id);

  if (!isActive(row)) {
    return res.json({
      plan: 'free',
      status: row ? row.status : 'inactive',
      expires_at: row ? row.expires_at : null,
      features: FEATURES.free,
    });
  }

  res.json({
    plan: row.plan_code,
    status: row.status,
    expires_at: row.expires_at,
    features: FEATURES[row.plan_code] || FEATURES.basic,
  });
});

router.post('/', requireAuth, (req, res) => {
  const { plan_code } = req.body || {};

  if (!PLANS.has(plan_code)) {
    return res.status(400).json({ error: 'plan_code must be one of: basic, premium.' });
  }

  // MOCK subscription — no payment gateway, no validation of card details.
  // It simply upserts the record (user_id is UNIQUE) and marks it active.
  const result = db
    .prepare(`
      INSERT INTO subscriptions (user_id, plan_code, started_at, expires_at, status)
      VALUES (?, ?, datetime('now'), datetime('now', ?), ?)
      ON CONFLICT(user_id) DO UPDATE SET
        plan_code = excluded.plan_code,
        started_at = excluded.started_at,
        expires_at = excluded.expires_at,
        status = excluded.status
    `)
    .run(req.user.id, plan_code, PLAN_DURATION[plan_code], ACTIVE_STATUS);

  const row = db
    .prepare('SELECT * FROM subscriptions WHERE user_id = ?')
    .get(req.user.id);

  res.status(201).json({
    id: result.lastInsertRowid,
    plan: row.plan_code,
    status: row.status,
    started_at: row.started_at,
    expires_at: row.expires_at,
    features: FEATURES[row.plan_code],
  });
});

router.delete('/', requireAuth, (req, res) => {
  const row = subscriptionRow(req.user.id);
  if (!row) {
    return res.json({ plan: 'free', status: 'inactive', expires_at: null, features: FEATURES.free });
  }

  // Keep the record (audit trail) but mark it cancelled so GET falls back to free.
  db.prepare('UPDATE subscriptions SET status = ?, expires_at = datetime(\'now\') WHERE user_id = ?')
    .run('cancelled', req.user.id);

  res.json({ plan: 'free', status: 'cancelled', expires_at: null, features: FEATURES.free });
});

module.exports = router;
