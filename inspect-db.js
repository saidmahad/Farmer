// inspect-db.js
// Quick schema inspection using better-sqlite3

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'agri.db');
console.log('Opening database at:', dbPath);

try {
  const db = new Database(dbPath);

  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('\n=== TABLES ===');
  tables.forEach(t => console.log(' -', t.name));

  // For each table, show schema
  tables.forEach(t => {
    console.log(`\n=== ${t.name} ===`);
    const info = db.prepare(`PRAGMA table_info(${t.name})`).all();
    info.forEach(col => {
      console.log(`  ${col.name}: ${col.type}${col.pk ? ' PRIMARY KEY' : ''}${col.notnull ? ' NOT NULL' : ''}`);
    });
    const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${t.name}`).get();
    console.log(`  (${count.cnt} rows)`);
  });

  db.close();
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
