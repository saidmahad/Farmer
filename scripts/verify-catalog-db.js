// scripts/verify-catalog-db.js
// Verifies the applied state of the plant catalog in db/agri.db.
// Run after `node db/migrations/run.js`.
const Database = require('better-sqlite3');
const path = require('path');

const catalog = require(path.join(__dirname, '..', 'db', 'catalog', 'plant-catalog.json'));
const db = new Database(path.join(__dirname, '..', 'db', 'agri.db'), { readonly: true });

const rows = db.prepare('SELECT slug, name, category, image_url FROM plants ORDER BY slug').all();
console.log('TOTAL plants:', rows.length);

let failed = 0;

// Source-of-truth sync check: DB must contain exactly the catalog slugs.
const dbSlugs = new Set(rows.map((r) => r.slug));
const catSlugs = new Set(catalog.map((c) => c.slug));
const missingInDb = catalog.filter((c) => !dbSlugs.has(c.slug));
const staleInDb = rows.filter((r) => !catSlugs.has(r.slug));
if (missingInDb.length) {
  failed++;
  console.log('ERROR: crops missing from DB:', missingInDb.map((c) => c.slug).join(', '));
}
if (staleInDb.length) {
  failed++;
  console.log('ERROR: stale crops in DB not in catalog:', staleInDb.map((r) => r.slug).join(', '));
}

const byCat = {};
rows.forEach((r) => (byCat[r.category] = (byCat[r.category] || 0) + 1));
console.log('BY CATEGORY:', JSON.stringify(byCat));

const noDetail = db
  .prepare(
    "SELECT COUNT(*) n FROM plants WHERE overview_json = '{}' OR agronomy_json = '{}' OR pests_json = '[]' OR resources_json = '[]'"
  )
  .get();
console.log('rows with empty detail JSON:', noDetail.n);

const emptyImg = db
  .prepare("SELECT COUNT(*) n FROM plants WHERE image_url IS NULL OR image_url = ''")
  .get();
console.log('rows with no image:', emptyImg.n);

const dupImgs = db.prepare('SELECT image_url, COUNT(*) c FROM plants GROUP BY image_url HAVING c > 1').all();
console.log('duplicate image URLs:', dupImgs.length);

const unsplash = db.prepare("SELECT COUNT(*) n FROM plants WHERE image_url LIKE '%unsplash%'").get();
console.log('rows still on unsplash:', unsplash.n);

const broken = db
  .prepare("SELECT COUNT(*) n FROM plants WHERE image_url LIKE '%ber946%'")
  .get();
console.log('rows with typo/broken URL:', broken.n);

const stale = db
  .prepare("SELECT COUNT(*) n FROM plants WHERE slug IN ('mung_bean', 'citrus')")
  .get();
console.log('stale rows (mung_bean/citrus):', stale.n);

const lemon = db.prepare("SELECT name, scientific_name, image_url FROM plants WHERE slug = 'lemon'").get();
console.log('lemon row:', JSON.stringify(lemon));

const samples = db
  .prepare(
    "SELECT slug, name, image_url, substr(description, 1, 60) d FROM plants WHERE slug IN ('onion', 'potato', 'yam', 'turmeric', 'rubber') ORDER BY slug"
  )
  .all();
console.log('\nKey-fix samples:');
for (const s of samples) console.log(`  ${s.slug}: ${s.image_url.split('/').pop()} | ${s.d}...`);

db.close();
if (failed) process.exitCode = 1;
else console.log('\nDB matches the catalog exactly.');
