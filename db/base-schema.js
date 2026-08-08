// db/base-schema.js
// Base-table DDL shared by the server bootstrap (db/index.js) and the
// migration runner (db/migrations/run.js).
//
// Single source of truth for the legacy `users` and `crops` tables:
// db/index.js creates them when the server boots, and run.js creates them
// too so the migration chain can run against a BRAND-NEW database (e.g. a
// fresh deployment, where nothing has booted the server yet). Feature
// tables (plants, diseases, videos, …) live in the migrations instead.
//
// Idempotent: all statements are CREATE TABLE IF NOT EXISTS.

module.exports = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS crops (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_name        TEXT NOT NULL UNIQUE,
    local_name       TEXT,
    season           TEXT,
    planting_method  TEXT NOT NULL,
    irrigation       TEXT NOT NULL,
    fertilizer       TEXT NOT NULL,
    common_pests     TEXT,
    days_to_harvest  TEXT
  );
`;
