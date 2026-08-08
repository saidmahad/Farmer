// routes/diseases.js
// GET /api/diseases          - list all diseases
// GET /api/diseases/:slug    - one disease with full text

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM diseases ORDER BY name')
    .all();
  res.json({ diseases: rows });
});

router.get('/:slug', requireAuth, (req, res) => {
  const slug = String(req.params.slug || '').slice(0, 80);
  const row = db.prepare('SELECT * FROM diseases WHERE slug = ?').get(slug);
  if (!row) return res.status(404).json({ error: 'Disease not found.' });
  res.json({ disease: row });
});

module.exports = router;