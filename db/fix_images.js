// One-off script: fix 4 mismatched plant images in the live database.
// Each URL was visually verified against the crop before assignment.
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'agri.db'));

const fixes = [
  {
    slug: 'cotton',
    url: 'https://images.unsplash.com/photo-1502395809857-fd80069897d0?w=400&h=300&fit=crop',
  },
  {
    slug: 'onion',
    url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=300&fit=crop',
  },
  {
    slug: 'sugarcane',
    url: 'https://images.unsplash.com/photo-1637335556827-bf5923d77f33?w=400&h=300&fit=crop',
  },
  {
    slug: 'groundnut',
    url: 'https://images.unsplash.com/photo-1549978113-29eb25c8177f?w=400&h=300&fit=crop',
  },
];

const update = db.prepare('UPDATE plants SET image_url = ? WHERE slug = ?');
const check = db.prepare('SELECT slug, name, image_url FROM plants WHERE slug = ?');

for (const fix of fixes) {
  const before = check.get(fix.slug);
  const result = update.run(fix.url, fix.slug);
  const after = check.get(fix.slug);
  console.log(`${result.changes === 1 ? 'UPDATED' : 'NO CHANGE'}  ${before.name} (${before.slug})`);
  console.log(`   before: ${before.image_url.split('photo-')[1].split('?')[0]}`);
  console.log(`   after:  ${after.image_url.split('photo-')[1].split('?')[0]}`);
}

db.close();
console.log('\nDone.');
