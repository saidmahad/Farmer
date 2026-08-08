// routes/reports.js
// GET /api/reports        - summary stats for the current user
// GET /api/reports/export - CSV export of the user's activity

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Escape a single value for CSV output. Commas, double-quotes, and newlines
// are wrapped in double-quotes; internal double-quotes are doubled.
function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function csvRow(values) {
  return values.map(csvEscape).join(',');
}

router.get('/', requireAuth, (req, res) => {
  const userId = req.user.id;

  const totalCrops = db.prepare('SELECT COUNT(*) AS count FROM crops').get().count;

  const totalSoilPredictions = db
    .prepare('SELECT COUNT(*) AS count FROM soil_predictions WHERE user_id = ?')
    .get(userId).count;

  const totalFeedback = db
    .prepare('SELECT COUNT(*) AS count FROM feedback WHERE user_id = ?')
    .get(userId).count;

  const totalChatMessages = db
    .prepare('SELECT COUNT(*) AS count FROM chat_messages WHERE user_id = ?')
    .get(userId).count;

  // Most recently viewed crop — client-side only (recentCrops localStorage);
  // we have no server-side tracking table, so return null for now.
  const mostRecentlyViewedCrop = null;

  // Wrapped as { stats } so the Reports page can read a single object.
  // Field names are camelCase to match the frontend's ReportsStats type.
  res.json({
    stats: {
      cropCount: totalCrops,
      soilPredictions: totalSoilPredictions,
      feedbackCount: totalFeedback,
      chatMessages: totalChatMessages,
      lastViewedCrop: mostRecentlyViewedCrop,
    },
  });
});

router.get('/export', requireAuth, (req, res) => {
  const userId = req.user.id;

  // --- Section 1: Soil predictions ----------------------------------------
  const soilPredictions = db
    .prepare(`
      SELECT id, predicted_type, confidence, ph, nitrogen, phosphorus,
             potassium, organic_matter, salinity, recommendations_json, created_at
        FROM soil_predictions
       WHERE user_id = ?
       ORDER BY created_at DESC
    `)
    .all(userId);

  // --- Section 2: Feedback ------------------------------------------------
  const feedback = db
    .prepare(`
      SELECT id, category, rating, message, status, admin_notes, created_at
        FROM feedback
       WHERE user_id = ?
       ORDER BY created_at DESC
    `)
    .all(userId);

  // --- Section 3: Chat summary -------------------------------------------
  const chatStats = db
    .prepare(`
      SELECT
        COUNT(*)                                      AS total_messages,
        SUM(CASE WHEN role = 'user'      THEN 1 ELSE 0 END) AS user_messages,
        SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) AS assistant_messages,
        MIN(created_at)                               AS first_message_at,
        MAX(created_at)                               AS last_message_at
        FROM chat_messages
       WHERE user_id = ?
    `)
    .get(userId);

  // --- Build CSV ----------------------------------------------------------
  const lines = [];

  // Soil predictions
  lines.push(csvRow([
    'id', 'predicted_type', 'confidence', 'ph', 'nitrogen',
    'phosphorus', 'potassium', 'organic_matter', 'salinity',
    'recommendations', 'created_at',
  ]));
  for (const r of soilPredictions) {
    lines.push(csvRow([
      r.id, r.predicted_type, r.confidence, r.ph, r.nitrogen,
      r.phosphorus, r.potassium, r.organic_matter, r.salinity,
      r.recommendations_json, r.created_at,
    ]));
  }
  lines.push('');

  // Feedback
  lines.push(csvRow([
    'id', 'category', 'rating', 'message', 'status', 'admin_notes', 'created_at',
  ]));
  for (const r of feedback) {
    lines.push(csvRow([
      r.id, r.category, r.rating, r.message, r.status, r.admin_notes, r.created_at,
    ]));
  }
  lines.push('');

  // Chat summary
  lines.push(csvRow([
    'total_messages', 'user_messages', 'assistant_messages',
    'first_message_at', 'last_message_at',
  ]));
  lines.push(csvRow([
    chatStats.total_messages || 0,
    chatStats.user_messages || 0,
    chatStats.assistant_messages || 0,
    chatStats.first_message_at || '',
    chatStats.last_message_at || '',
  ]));

  const csv = lines.join('\r\n') + '\r\n';

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="agri-advisor-report.csv"');
  res.send(csv);
});

module.exports = router;
