// routes/crops.js
// GET /api/crops       - list all crops (id + names only, for the selection page)
// GET /api/crops/:id   - full agronomic details for one crop

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const crops = db
    .prepare('SELECT id, crop_name, local_name, season FROM crops ORDER BY crop_name')
    .all();
  res.json({ crops });
});

router.get('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Crop id must be an integer.' });
  }

  const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(id);
  if (!crop) {
    return res.status(404).json({ error: 'Crop not found.' });
  }

  res.json({ crop });
});

module.exports = router;
