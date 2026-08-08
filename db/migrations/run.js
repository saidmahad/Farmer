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

const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, '..', '..', 'db', 'agri.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Discover migrations in deterministic order. Each file is expected to
// export { up(db) -> summary }.
const migrations = [
  require('./001_initial_farmerai'),
  require('./002_seed_figma_catalog'),
  require('./003_seed_diseases'),
  require('./004_seed_videos'),
];

function run() {
  console.log(`Running migrations against ${DB_PATH} ...`);

  const summary = { steps: [] };
  for (const [i, m] of migrations.entries()) {
    const stepName = `00${i + 1}`.slice(-3);
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
      step: stepName,
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