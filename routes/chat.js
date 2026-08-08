// routes/chat.js
// POST   /api/chat - send a message, get a template-based assistant reply
// GET    /api/chat - current user's chat history (50 most recent)
// DELETE /api/chat - clear the current user's chat history
//
// NOTE: The assistant reply is a simple keyword-based stand-in, NOT a real
// AI/LLM response. It is demo-only and NOT PRODUCTION READY — wire up a real
// model (and moderation) before shipping.

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const CHAT_HISTORY_LIMIT = 50;

// Keywords that route the user toward existing tools when no crop is detected.
const SOIL_KEYWORDS = ['soil', 'dirt', 'ph', 'fertilizer'];
const DISEASE_KEYWORDS = ['disease', 'pest', 'blight', 'rust', 'fungus', 'insect', 'infest'];

function buildCropKeywordMap() {
  // Map a lowercased searchable keyword -> the crop row it refers to.
  // We register the full name, the local name, and the base name (without
  // any parenthetical like "Rice (Paddy)") so free-text questions match.
  const map = new Map();
  const crops = db.prepare('SELECT * FROM crops').all();
  for (const crop of crops) {
    const names = [crop.crop_name, crop.local_name]
      .filter(Boolean)
      .map((n) => String(n).trim().toLowerCase());
    const base = names.length ? names[0].replace(/\s*\(.*\)\s*$/, '').trim() : '';
    const keywords = [...new Set([...names, ...(base ? [base] : [])])].filter((k) => k.length >= 3);
    for (const k of keywords) map.set(k, crop);
  }
  return map;
}

function generateAssistantReply(message) {
  const text = message.trim().toLowerCase();
  const cropMap = buildCropKeywordMap();

  // 1) Crop-specific advice — look up every crop named in the message.
  const matched = [];
  for (const [keyword, crop] of cropMap) {
    if (text.includes(keyword)) matched.push(crop);
  }
  if (matched.length) {
    // Deduplicate by crop id, then render one block per crop.
    const seen = new Set();
    const blocks = [];
    for (const crop of matched) {
      if (seen.has(crop.id)) continue;
      seen.add(crop.id);
      blocks.push(
        `Here's advice for ${crop.crop_name} (${crop.local_name || crop.crop_name}):\n` +
          `• Planting: ${crop.planting_method}\n` +
          `• Irrigation: ${crop.irrigation}\n` +
          `• Fertilizer: ${crop.fertilizer}\n` +
          `• Common pests/diseases: ${crop.common_pests || 'not listed'}\n` +
          `• Days to harvest: ${crop.days_to_harvest || 'not listed'}\n` +
          `• Season: ${crop.season || 'not listed'}`
      );
    }
    return (
      blocks.join('\n\n') +
      '\n\nWould you like details on a specific crop, or help with a soil reading for your field?'
    );
  }

  // 2) Soil question — point at the soil prediction tool.
  if (SOIL_KEYWORDS.some((k) => text.includes(k))) {
    return (
      'I can help with that. Use the Soil Prediction tool to upload a soil photo ' +
      '(with optional pH / NPK readings) and get a predicted soil type plus ' +
      'specific recommendations for your field.'
    );
  }

  // 3) Pest / disease question — point at the disease library.
  if (DISEASE_KEYWORDS.some((k) => text.includes(k))) {
    return (
      'Check the Disease Library for symptoms, treatments, and prevention for common ' +
      'crop pests and diseases. If you tell me the crop and what you are seeing, I can ' +
      'narrow it down further.'
    );
  }

  // 4) Fallback — generic helpful response.
  return (
    'I can help with crop-specific advice (try naming a crop like rice, wheat, or tomato), ' +
    'soil health and fertilizer guidance, or identifying pests and diseases. ' +
    'What would you like to know about your farm today?'
  );
}

function nowIso() {
  return new Date().toISOString();
}

router.post('/', requireAuth, (req, res) => {
  const { message } = req.body || {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required.' });
  }
  if (message.trim().length > 5000) {
    return res.status(400).json({ error: 'message is too long (max 5000 characters).' });
  }

  const userContent = message.trim();
  const assistantContent = generateAssistantReply(userContent);
  const ts = nowIso();

  const userResult = db
    .prepare('INSERT INTO chat_messages (user_id, role, content, created_at) VALUES (?, ?, ?, ?)')
    .run(req.user.id, 'user', userContent, ts);

  const assistantResult = db
    .prepare('INSERT INTO chat_messages (user_id, role, content, created_at) VALUES (?, ?, ?, ?)')
    .run(req.user.id, 'assistant', assistantContent, ts);

  res.status(201).json({
    userMessage: {
      id: userResult.lastInsertRowid,
      role: 'user',
      content: userContent,
      created_at: ts,
    },
    assistantMessage: {
      id: assistantResult.lastInsertRowid,
      role: 'assistant',
      content: assistantContent,
      created_at: ts,
    },
    id: assistantResult.lastInsertRowid,
  });
});

router.get('/', requireAuth, (req, res) => {
  // The 50 most recent rows, returned oldest→newest so the client can render
  // the conversation top-to-bottom without reversing it.
  const rows = db
    .prepare(`
      SELECT id, role, content, created_at
        FROM (
          SELECT id, role, content, created_at
            FROM chat_messages
           WHERE user_id = ?
           ORDER BY created_at DESC, id DESC
           LIMIT ?
        )
       ORDER BY created_at ASC, id ASC
    `)
    .all(req.user.id, CHAT_HISTORY_LIMIT);

  res.json({ messages: rows });
});

router.delete('/', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(req.user.id);
  res.json({ deleted: info.changes });
});

module.exports = router;
