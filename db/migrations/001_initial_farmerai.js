// db/migrations/001_initial_farmerai.js
// First FarmerAI migration. Adds the new user profile fields and creates
// empty tables for the features shipping across build groups 2–5.
//
// Forward-only. No destructive schema changes to existing tables — the
// legacy `users` and `crops` rows stay as they are (and stay out of the
// live app per the data decision; the backup is db/agri_legacy_backup_*.db).
//
// Tables created:
//   - plants              (PlantExplorer catalog; seeded in group 2)
//   - diseases            (DiseaseLibrary catalog; seeded in group 4)
//   - videos              (VideoHub catalog; seeded in group 5)
//   - soil_predictions    (SoilPrediction results; written by group 4)
//   - growth_calendar_entries  (calendar CRUD; written by group 4)
//   - feedback            (Feedback + AdminDashboard; written by group 5)
//   - subscriptions       (Subscription; written by group 5)
//   - chat_messages       (Chatbot history; written by group 5)
//
// Columns added to users (guarded via PRAGMA table_info):
//   - region      TEXT
//   - land_size   REAL
//   - farm_type   TEXT
//   - language    TEXT DEFAULT 'en'
//   - role        TEXT DEFAULT 'farmer'

function columnExists(db, tableName, columnName) {
  const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return cols.some((c) => c.name === columnName);
}

function addColumnIfMissing(db, tableName, columnName, definition) {
  if (columnExists(db, tableName, columnName)) return false;
  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  return true;
}

function tableExists(db, tableName) {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(tableName);
  return Boolean(row);
}

function up(db) {
  // ---- users: guarded ALTER TABLE for the new profile fields ----------
  const added = [];
  added.push(
    addColumnIfMissing(db, 'users', 'region', `TEXT`)
  );
  added.push(
    addColumnIfMissing(db, 'users', 'land_size', `REAL`)
  );
  added.push(
    addColumnIfMissing(db, 'users', 'farm_type', `TEXT`)
  );
  added.push(
    addColumnIfMissing(db, 'users', 'language', `TEXT DEFAULT 'en'`)
  );
  added.push(
    addColumnIfMissing(db, 'users', 'role', `TEXT DEFAULT 'farmer'`)
  );

  // ---- Feature tables (create-if-missing) ----------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS plants (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      slug            TEXT NOT NULL UNIQUE,
      name            TEXT NOT NULL,
      scientific_name TEXT,
      category        TEXT,
      season          TEXT,
      water_need      TEXT,
      climate         TEXT,
      region          TEXT,
      duration        TEXT,
      expected_yield  TEXT,
      difficulty      TEXT,
      profitability   TEXT,
      market_price    TEXT,
      image_url       TEXT,
      description     TEXT,
      overview_json   TEXT, -- JSON: family, lifecycle, planting_depth, spacing, soil_type, ph_range
      agronomy_json   TEXT, -- JSON: land_prep, seed_rate, fertilizer, irrigation, intercropping
      pests_json      TEXT, -- JSON: [{name, severity, treatment}, ...]
      resources_json  TEXT  -- JSON: [{title, type, duration}, ...]
    );

    CREATE TABLE IF NOT EXISTS diseases (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      slug            TEXT NOT NULL UNIQUE,
      name            TEXT NOT NULL,
      crop_slug       TEXT,        -- references plants.slug (loose)
      category        TEXT,        -- fungal / bacterial / viral / pest / deficiency
      severity        TEXT,        -- low / medium / high
      symptoms        TEXT,
      treatment       TEXT,
      prevention      TEXT,
      image_url       TEXT
    );

    CREATE TABLE IF NOT EXISTS videos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      slug            TEXT NOT NULL UNIQUE,
      title           TEXT NOT NULL,
      topic           TEXT,        -- irrigation / pest / soil / harvest / etc
      crop_slug       TEXT,
      duration        TEXT,        -- e.g. "12:30"
      youtube_id      TEXT NOT NULL,
      thumbnail_url   TEXT,
      description     TEXT
    );

    CREATE TABLE IF NOT EXISTS soil_predictions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      image_path      TEXT NOT NULL,
      predicted_type  TEXT,
      confidence      REAL,
      ph              REAL,
      nitrogen        TEXT,
      phosphorus      TEXT,
      potassium       TEXT,
      organic_matter  TEXT,
      salinity        TEXT,
      recommendations_json TEXT,    -- JSON array of strings
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS growth_calendar_entries (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      plant_slug      TEXT,
      title           TEXT NOT NULL,
      crop_label      TEXT,
      start_date      TEXT NOT NULL,
      end_date        TEXT,
      status          TEXT DEFAULT 'planned',  -- planned / active / done
      notes           TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      category        TEXT NOT NULL,        -- bug / feature / content / other
      rating          INTEGER,              -- 1..5
      message         TEXT NOT NULL,
      screenshot_path TEXT,
      status          TEXT DEFAULT 'new',   -- new / in_progress / resolved / dismissed
      admin_notes     TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id),
      plan_code       TEXT NOT NULL,        -- free / basic / pro
      started_at      TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at      TEXT,
      status          TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      role            TEXT NOT NULL,        -- user / assistant
      content         TEXT NOT NULL,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_soil_predictions_user
      ON soil_predictions(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_calendar_user
      ON growth_calendar_entries(user_id, start_date);
    CREATE INDEX IF NOT EXISTS idx_feedback_status
      ON feedback(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_chat_user
      ON chat_messages(user_id, created_at);
  `);

  return {
    usersColumnsAdded: added.filter(Boolean).length,
    usersColumnsAlreadyPresent: added.filter((x) => !x).length,
    tablesCreated: [
      'plants', 'diseases', 'videos', 'soil_predictions',
      'growth_calendar_entries', 'feedback', 'subscriptions', 'chat_messages',
    ].filter((t) => tableExists(db, t)),
  };
}

module.exports = { up, columnExists, tableExists };