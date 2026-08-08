// routes/feedback.js
// POST /api/feedback              - submit feedback (optionally with a screenshot)
// GET  /api/feedback              - list the current user's feedback, newest first
// GET  /api/feedback/admin        - list ALL feedback with the submitter's name (admin only)
// PATCH /api/feedback/:id/admin   - admin updates feedback status / notes (admin only)

const express = require('express');
const path = require('path');
const { uploadFeedback } = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

const CATEGORIES = new Set(['bug', 'feature', 'general']);
const STATUSES = new Set(['open', 'in_progress', 'resolved']);

function isAdmin(req) {
  return req.user && req.user.role === 'admin';
}

router.post('/', requireAuth, uploadFeedback.single('screenshot'), (req, res) => {
  const { category, rating, message } = req.body || {};

  if (!CATEGORIES.has(category)) {
    return res.status(400).json({ error: 'category must be one of: bug, feature, general.' });
  }

  const ratingNum = rating === undefined || rating === null || rating === '' ? null : Number(rating);
  if (ratingNum != null && (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5)) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5.' });
  }

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required.' });
  }

  const screenshotPath = req.file
    ? path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/')
    : null;

  const result = db
    .prepare(`
      INSERT INTO feedback
        (user_id, category, rating, message, screenshot_path, status)
      VALUES (?, ?, ?, ?, ?, 'open')
    `)
    .run(req.user.id, category, ratingNum, message.trim(), screenshotPath);

  const row = db
    .prepare(
      'SELECT id, category, rating, message, status, created_at FROM feedback WHERE id = ?'
    )
    .get(result.lastInsertRowid);

  res.status(201).json({ ...row, screenshot_path: screenshotPath });
});

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare(`
      SELECT id, category, rating, message, screenshot_path, status,
             admin_notes, created_at, updated_at
        FROM feedback
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
    `)
    .all(req.user.id);

  res.json({ feedback: rows });
});

router.get('/admin', requireAuth, (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  const rows = db
    .prepare(`
      SELECT f.id, f.user_id, u.name AS user_name, f.category, f.rating,
             f.message, f.screenshot_path, f.status, f.admin_notes,
             f.created_at, f.updated_at
        FROM feedback f
        JOIN users u ON u.id = f.user_id
       ORDER BY f.created_at DESC, f.id DESC
    `)
    .all();

  res.json({ feedback: rows });
});

router.patch('/:id/admin', requireAuth, (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Feedback id must be an integer.' });
  }

  const existing = db.prepare('SELECT id FROM feedback WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Feedback not found.' });
  }

  const { status, admin_notes } = req.body || {};

  if (status !== undefined && status !== null && status !== '' && !STATUSES.has(status)) {
    return res.status(400).json({ error: 'status must be one of: open, in_progress, resolved.' });
  }

  // Build the UPDATE from whatever subset was supplied so a partial patch
  // (status only, notes only, or both) behaves predictably.
  const updates = [];
  const values = [];
  if (status !== undefined && status !== null && status !== '') {
    updates.push('status = ?');
    values.push(status);
  }
  if (admin_notes !== undefined && admin_notes !== null) {
    updates.push('admin_notes = ?');
    values.push(String(admin_notes));
  }
  if (!updates.length) {
    return res.status(400).json({ error: 'No updatable fields supplied.' });
  }

  updates.push('updated_at = datetime(\'now\')');
  values.push(id);

  db.prepare(`UPDATE feedback SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const row = db
    .prepare(`
      SELECT id, user_id, category, rating, message, screenshot_path,
             status, admin_notes, created_at, updated_at
        FROM feedback
       WHERE id = ?
    `)
    .get(id);

  res.json({ feedback: row });
});

module.exports = router;
