// routes/advice.js
// GET /api/advice?crop_id=:id - formatted, natural-language farming advice

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { generateAdvice } = require('../utils/adviceGenerator');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const cropId = Number(req.query.crop_id);
  if (!Number.isInteger(cropId)) {
    return res.status(400).json({ error: 'Query param crop_id (integer) is required.' });
  }

  const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(cropId);
  if (!crop) {
    return res.status(404).json({ error: 'Crop not found.' });
  }

  const advice = await generateAdvice(crop);

  res.json({
    crop: {
      id: crop.id,
      crop_name: crop.crop_name,
      local_name: crop.local_name,
      season: crop.season
    },
    advice: advice.text,
    source: advice.source, // 'ai' if ANTHROPIC_API_KEY is configured, else 'template'
    fields: {
      planting_method: crop.planting_method,
      irrigation: crop.irrigation,
      fertilizer: crop.fertilizer,
      common_pests: crop.common_pests,
      days_to_harvest: crop.days_to_harvest
    }
  });
});

module.exports = router;
