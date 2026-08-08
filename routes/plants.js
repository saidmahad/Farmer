// routes/plants.js
// GET /api/plants        - list all plants (rich catalog for PlantExplorer)
// GET /api/plants/:slug  - one plant with overview/agronomy/pests/resources parsed

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function safeParse(s, fallback) {
  try {
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
}

function shape(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    scientific_name: row.scientific_name,
    category: row.category,
    season: row.season,
    water_need: row.water_need,
    climate: row.climate,
    region: row.region,
    duration: row.duration,
    expected_yield: row.expected_yield,
    difficulty: row.difficulty,
    profitability: row.profitability,
    market_price: row.market_price,
    image_url: row.image_url,
    description: row.description,
    overview: safeParse(row.overview_json, {}),
    agronomy: safeParse(row.agronomy_json, {}),
    pests: safeParse(row.pests_json, []),
    resources: safeParse(row.resources_json, []),
  };
}

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM plants ORDER BY name')
    .all();
  res.json({ plants: rows.map(shape) });
});

router.get('/:slug', requireAuth, (req, res) => {
  const slug = String(req.params.slug || '').slice(0, 80);
  const row = db.prepare('SELECT * FROM plants WHERE slug = ?').get(slug);
  if (!row) return res.status(404).json({ error: 'Plant not found.' });
  res.json({ plant: shape(row) });
});

module.exports = router;