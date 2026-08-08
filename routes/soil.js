// routes/soil.js
// POST /api/soil-predictions  - upload a soil photo + optional readings,
//                              returns a deterministic "prediction" that
//                              summarises likely soil type and gives
//                              practical recommendations.
// GET  /api/soil-predictions  - list this user's recent predictions.
//
// The model is a stand-in until a real CV/ML pipeline is plugged in.
// It uses the supplied soil_type + pH/nutrient hints to build the
// advisory deterministically so the demo feels real without inventing
// numbers we can't defend.

const express = require('express');
const path = require('path');
const { uploadSoil } = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

const SOIL_TYPES = new Set(['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky']);

function predictSoil({ soilType, ph, nitrogen, phosphorus, potassium, organicMatter, salinity }) {
  const recs = [];
  const phNum = ph == null || ph === '' ? null : Number(ph);
  const omNum = organicMatter == null || organicMatter === '' ? null : Number(organicMatter);

  // Recommendations derived from the readings. Order matters — general
  // advice first, then targeted adjustments.
  if (phNum != null) {
    if (phNum < 6.0) {
      recs.push('Soil is acidic (pH ' + phNum.toFixed(1) + '). Apply agricultural lime at 0.5–1 t/ha to lift pH toward 6.5.');
    } else if (phNum > 7.8) {
      recs.push('Soil is alkaline (pH ' + phNum.toFixed(1) + '). Apply gypsum or elemental sulphur and use acid-forming fertilizers.');
    } else {
      recs.push('pH is in the favorable 6.0–7.8 range for most field crops.');
    }
  }

  if (nitrogen === 'low') recs.push('Nitrogen is low. Side-dress with 30–40 kg N/ha within the next 7 days.');
  else if (nitrogen === 'medium') recs.push('Nitrogen is adequate for the current season.');
  else if (nitrogen === 'high') recs.push('Nitrogen is high. Skip nitrogen fertilization for the next crop cycle to avoid lodging.');

  if (phosphorus === 'low') recs.push('Phosphorus is low. Apply single superphosphate (SSP) at 50–60 kg P/ha as basal.');
  else if (phosphorus === 'medium') recs.push('Phosphorus is adequate.');
  else if (phosphorus === 'high') recs.push('Phosphorus is high. Skip P this cycle.');

  if (potassium === 'low') recs.push('Potassium is low. Apply muriate of potash (MOP) at 30–40 kg K/ha.');
  else if (potassium === 'medium') recs.push('Potassium is adequate.');
  else if (potassium === 'high') recs.push('Potassium is high. Skip K this cycle.');

  if (omNum != null && omNum < 1.0) {
    recs.push('Organic matter is low (<1%). Incorporate 5–8 t/ha of well-rotted FYM or compost before next sowing.');
  } else if (omNum != null && omNum >= 2.5) {
    recs.push('Organic matter is healthy (≥2.5%). Keep up residue retention.');
  }

  if (salinity === 'high') recs.push('Salinity is high. Leach the field with good-quality irrigation water and avoid further salt inputs.');

  if (!recs.length) recs.push('Submit at least one reading (pH, NPK, or organic matter) to get specific recommendations.');

  // Predicted type: trust the client-supplied label if it's in the
  // known set, otherwise guess from pH.
  let predicted = soilType || 'Loamy';
  if (!SOIL_TYPES.has(predicted) && phNum != null) {
    if (phNum < 6.0) predicted = 'Sandy';
    else if (phNum > 7.5) predicted = 'Clay';
    else predicted = 'Loamy';
  }

  // Confidence is a deterministic value based on how much info we have.
  // More readings → higher confidence.
  const clues = [soilType, ph, nitrogen, phosphorus, potassium, organicMatter, salinity].filter(
    (x) => x !== undefined && x !== null && x !== ''
  );
  const confidence = Math.min(0.97, 0.55 + clues.length * 0.06);

  return {
    predicted_type: predicted,
    confidence: Number(confidence.toFixed(2)),
    recommendations: recs,
  };
}

function normalizeLevel(v) {
  if (v == null || v === '') return null;
  const s = String(v).trim().toLowerCase();
  if (!s) return null;
  const allowed = ['low', 'medium', 'high'];
  return allowed.includes(s) ? s : null;
}

function normalizeSalinity(v) {
  if (v == null || v === '') return null;
  const s = String(v).trim().toLowerCase();
  if (!s) return null;
  const allowed = ['low', 'medium', 'high'];
  return allowed.includes(s) ? s : null;
}

router.post('/soil-predictions', requireAuth, uploadSoil.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'An image file is required (field name "image").' });
  }

  const { soil_type, ph, nitrogen, phosphorus, potassium, organic_matter, salinity } = req.body || {};

  const phNum = ph == null || ph === '' ? null : Number(ph);
  if (phNum != null && (!Number.isFinite(phNum) || phNum < 0 || phNum > 14)) {
    return res.status(400).json({ error: 'pH must be a number between 0 and 14.' });
  }

  const prediction = predictSoil({
    soilType: soil_type && SOIL_TYPES.has(soil_type) ? soil_type : null,
    ph: phNum,
    nitrogen: normalizeLevel(nitrogen),
    phosphorus: normalizeLevel(phosphorus),
    potassium: normalizeLevel(potassium),
    organicMatter: organic_matter,
    salinity: normalizeSalinity(salinity),
  });

  const result = db
    .prepare(`
      INSERT INTO soil_predictions
        (user_id, image_path, predicted_type, confidence, ph,
         nitrogen, phosphorus, potassium, organic_matter, salinity,
         recommendations_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      req.user.id,
      path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/'),
      prediction.predicted_type,
      prediction.confidence,
      phNum,
      normalizeLevel(nitrogen),
      normalizeLevel(phosphorus),
      normalizeLevel(potassium),
      organic_matter || null,
      normalizeSalinity(salinity),
      JSON.stringify(prediction.recommendations)
    );

  res.status(201).json({
    id: result.lastInsertRowid,
    image_path: req.file.filename,
    predicted_type: prediction.predicted_type,
    confidence: prediction.confidence,
    recommendations: prediction.recommendations,
    created_at: new Date().toISOString(),
  });
});

router.get('/soil-predictions', requireAuth, (req, res) => {
  const rows = db
    .prepare(`
      SELECT id, image_path, predicted_type, confidence, ph,
             nitrogen, phosphorus, potassium, organic_matter, salinity,
             recommendations_json, created_at
        FROM soil_predictions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 25
    `)
    .all(req.user.id);

  res.json({
    predictions: rows.map((r) => ({
      ...r,
      recommendations: safeParse(r.recommendations_json, []),
    })),
  });
});

function safeParse(s, fallback) {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

module.exports = router;