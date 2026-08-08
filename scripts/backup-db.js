// scripts/backup-db.js
// One-off safety net before the FarmerAI data migration: snapshots the
// live SQLite DB (WAL-safe) into db/agri_legacy_backup_<date>.db and
// writes a human-readable JSON export of the existing tables.
//
// Usage: node scripts/backup-db.js

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'db', 'agri.db');

function dateStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`No database found at ${DB_PATH}. Nothing to back up.`);
    process.exit(1);
  }

  const stamp = dateStamp();
  const destPath = path.join(__dirname, '..', 'db', `agri_legacy_backup_${stamp}.db`);
  const jsonPath = path.join(__dirname, '..', 'db', `agri_legacy_backup_${stamp}.json`);

  const src = new Database(DB_PATH, { readonly: true });

  // Better-sqlite3 v11: backup(filename) is async (returns a Promise).
  // Must await before touching/closeing the source connection.
  await src.backup(destPath);
  console.log(`Database snapshot -> ${destPath}`);

  // JSON export of the tables we care about.
  const tables = ['users', 'crops'];
  const exportData = {};
  for (const table of tables) {
    const cols = src.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
    const rows = src.prepare(`SELECT * FROM ${table}`).all();
    exportData[table] = { columns: cols, rows };
    console.log(`  ${table}: ${rows.length} row(s) exported`);
  }

  fs.writeFileSync(jsonPath, JSON.stringify(exportData, null, 2), 'utf8');
  console.log(`JSON export       -> ${jsonPath}`);

  src.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
