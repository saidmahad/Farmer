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

module.exports = db;