// dump-data.js
// Quick data inspection of catalog tables.

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'agri.db');
const db = new Database(dbPath);

console.log('=== CROPS ===');
db.prepare('SELECT id, crop_name, season, days_to_harvest FROM crops').all().forEach(r =>
  console.log(`  [${r.id}] ${r.crop_name} | ${r.season} | ${r.days_to_harvest}`));

console.log('\n=== PLANTS ===');
db.prepare('SELECT id, slug, name, category FROM plants').all().forEach(r =>
  console.log(`  [${r.id}] ${r.slug} | ${r.name} | ${r.category}`));

console.log('\n=== DISEASES ===');
db.prepare('SELECT id, slug, name, crop_slug, severity FROM diseases').all().forEach(r =>
  console.log(`  [${r.id}] ${r.slug} | ${r.name} | crop=${r.crop_slug} | ${r.severity}`));

console.log('\n=== VIDEOS ===');
const videos = db.prepare('SELECT COUNT(*) as c FROM videos').get();
console.log(`  count=${videos.c}`);

console.log('\n=== USERS (first 5) ===');
db.prepare('SELECT id, name, email, role, language FROM users LIMIT 5').all().forEach(r =>
  console.log(`  [${r.id}] ${r.name} | ${r.email} | role=${r.role} | lang=${r.language}`));

db.close();
