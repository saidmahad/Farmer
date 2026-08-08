// routes/videos.js
// GET /api/videos          - list all tutorial videos
// GET /api/videos/:slug    - one tutorial video with details

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM videos ORDER BY title')
    .all();
  res.json({ videos: rows });
});

router.get('/:slug', requireAuth, (req, res) => {
  const slug = String(req.params.slug || '').slice(0, 80);
  const row = db.prepare('SELECT * FROM videos WHERE slug = ?').get(slug);
  if (!row) return res.status(404).json({ error: 'Video not found.' });
  res.json({ video: row });
});

module.exports = router;
