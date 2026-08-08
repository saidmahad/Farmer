// db/migrations/run.js
// Migration runner. Applies forward-only migrations against db/agri.db.
//
// Usage:
//   node db/migrations/run.js
//   DB_PATH=/path/to/other.db node db/migrations/run.js
//
// Idempotent: re-running is safe — guarded ALTERs and CREATE TABLE IF NOT
// EXISTS means each step is a no-op once applied. Prints a short summary.

const path = require('path');
const Database = require('better-sqlite3');
const BASE_SCHEMA = require('../base-schema');

const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, '..', '..', 'db', 'agri.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Fresh-DB bootstrap: the legacy `users`/`crops` tables are normally
// created by db/index.js when the server boots, but the migration chain
// assumes they already exist. Create them here so a brand-new database
// (e.g. a fresh deployment) can run the full chain in order.
db.exec(BASE_SCHEMA);

// Discover migrations in deterministic order. Each file is expected to
// export { up(db) -> summary }.
//
// Note: 005_expand_plants_catalog is intentionally NOT registered — it was a
// draft expansion whose rows were superseded by 006_apply_verified_plant_catalog
// (single source of truth: db/catalog/plant-catalog.json with verified images).
// On a fresh database 006 creates the full 64-crop catalog directly, so the
// draft's placeholder/mismatched images never enter a new build.
const migrations = [
  { file: '001_initial_farmerai', m: require('./001_initial_farmerai') },
  { file: '002_seed_figma_catalog', m: require('./002_seed_figma_catalog') },
  { file: '003_seed_diseases', m: require('./003_seed_diseases') },
  { file: '004_seed_videos', m: require('./004_seed_videos') },
  { file: '006_apply_verified_plant_catalog', m: require('./006_apply_verified_plant_catalog') },
  { file: '007_seed_crops_from_catalog', m: require('./007_seed_crops_from_catalog') },
];

function run() {
  console.log(`Running migrations against ${DB_PATH} ...`);

  const summary = { steps: [] };
  for (const { file, m } of migrations) {
    const before = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((r) => r.name)
      .sort()
      .join(',');
    const result = m.up(db);
    const after = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((r) => r.name)
      .sort()
      .join(',');

    summary.steps.push({
      step: file,
      tables: before !== after ? after : '(unchanged)',
      result,
    });
  }

  console.log('\nMigration summary:');
  for (const s of summary.steps) {
    console.log(`  step ${s.step}:`, JSON.stringify(s.result));
    console.log(`           tables now: ${s.tables}`);
  }
  console.log('\nDone.');
}

try {
  run();
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
} finally {
  db.close();
}