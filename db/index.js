// db/index.js
// SQLite connection + schema for the Agricultural Advisory System.
//
// This file is intentionally seed-free. The catalog data that drives the
// live app is owned by db/migrations/* (forward-only, idempotent) — see
// db/migrations/run.js. The previous legacy Somali crops (Galley,
// Qamadi, Basal, Yaanyo) are NOT seeded here; they live only in the
// snapshot at db/agri_legacy_backup_<date>.db per the data decision.
//
// Schema additions for the FarmerAI feature set (plants, diseases, etc.)
// live in db/migrations/001_initial_farmerai.js.

const path = require('path');
const Database = require('better-sqlite3');
const BASE_SCHEMA = require('./base-schema');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'agri.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------
// Schema (base tables; feature tables come from db/migrations/*)
// ---------------------------------------------------------------------
db.exec(BASE_SCHEMA);

// ---------------------------------------------------------------------
// Auto-migrate on a fresh/partial database
// ---------------------------------------------------------------------
// If the migration-created feature tables (plants, diseases, videos,
// chat, ...) are missing, apply the full migration chain right now.
// This makes the server self-healing: it works identically whether it is
// started via `npm start` (migrate && server) or a bare `node server.js`
// — which is exactly what a manually-created cloud service does (e.g. a
// Render web service whose start command is `node server.js`).
const hasFeatureTables = (() => {
  // Sentinel check across the key migration-created tables: if ANY of
  // them is missing the chain is incomplete (fresh DB, or a deploy whose
  // start command skipped `npm start`), so apply the full migration set.
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((r) => r.name);
  return ['plants', 'diseases', 'videos'].every((t) => tables.includes(t));
})();
if (!hasFeatureTables) {
  console.log('[db] Feature tables missing — applying migrations automatically...');
  require('./migrations/run').apply(db);
  console.log('[db] Migrations applied.');
}

module.exports = db;