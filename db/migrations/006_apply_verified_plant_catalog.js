// db/migrations/006_apply_verified_plant_catalog.js
//
// Applies the verified plant catalog (db/catalog/plant-catalog.json) to the
// `plants` table. This is the SINGLE SOURCE OF TRUTH for PlantExplorer data:
// every crop's facts, description, overview/agronomy/pests/resources detail
// JSON, and image.
//
// Image verification is enforced here: each crop references a Wikimedia
// Commons file whose FILENAME describes the crop (e.g. "File:Allium cepa.jpg"
// for onion). URLs are resolved by scripts/resolve-commons-images.js and
// mechanically verified by scripts/probe-commons-urls.js. If a crop has no
// verified image mapping, this migration THROWS instead of seeding a
// mismatched or placeholder image — the exact failure mode the Onion→potato
// bug caused.
//
// Idempotent: rows are upserted on the unique `slug` (ON CONFLICT DO UPDATE),
// so re-running is a no-op refresh and never churns row ids.
//
// Adding a crop later = add one object to plant-catalog.json (a "row", not
// code), run `node scripts/resolve-commons-images.js` + probe + `node
// db/migrations/run.js`.

const fs = require('node:fs');
const path = require('node:path');

const CATALOG_PATH = path.join(__dirname, '..', 'catalog', 'plant-catalog.json');
const IMAGES_PATH = path.join(__dirname, '..', 'catalog', 'commons-images.json');

function tableExists(db, name) {
  return Boolean(
    db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name)
  );
}

function up(db) {
  if (!tableExists(db, 'plants')) {
    throw new Error('plants table missing — run migration 001 first.');
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const images = JSON.parse(fs.readFileSync(IMAGES_PATH, 'utf8'));

  // ---- Verification gate (see header) ---------------------------------
  const missingImages = catalog.filter((c) => !images[c.slug]);
  if (missingImages.length) {
    throw new Error(
      `plant-catalog.json has ${missingImages.length} crop(s) without a verified ` +
      `Commons image: ${missingImages.map((c) => c.slug).join(', ')}. ` +
      `Run scripts/resolve-commons-images.js and re-verify first.`
    );
  }

  const upsert = db.prepare(`
    INSERT INTO plants
      (slug, name, scientific_name, category, season, water_need, climate, region,
       duration, expected_yield, difficulty, profitability, market_price,
       image_url, description, overview_json, agronomy_json, pests_json, resources_json)
    VALUES
      (@slug, @name, @scientific_name, @category, @season, @water_need, @climate, @region,
       @duration, @expected_yield, @difficulty, @profitability, @market_price,
       @image_url, @description, @overview_json, @agronomy_json, @pests_json, @resources_json)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      scientific_name = excluded.scientific_name,
      category = excluded.category,
      season = excluded.season,
      water_need = excluded.water_need,
      climate = excluded.climate,
      region = excluded.region,
      duration = excluded.duration,
      expected_yield = excluded.expected_yield,
      difficulty = excluded.difficulty,
      profitability = excluded.profitability,
      market_price = excluded.market_price,
      image_url = excluded.image_url,
      description = excluded.description,
      overview_json = excluded.overview_json,
      agronomy_json = excluded.agronomy_json,
      pests_json = excluded.pests_json,
      resources_json = excluded.resources_json
  `);

  const apply = db.transaction(() => {
    let upserted = 0;
    for (const c of catalog) {
      upsert.run({
        slug: c.slug,
        name: c.name,
        scientific_name: c.scientific_name,
        category: c.category,
        season: c.season,
        water_need: c.water_need,
        climate: c.climate,
        region: c.region,
        duration: c.duration,
        expected_yield: c.expected_yield,
        difficulty: c.difficulty,
        profitability: c.profitability,
        market_price: c.market_price,
        image_url: images[c.slug].url,
        description: c.description,
        overview_json: JSON.stringify(c.overview || {}),
        agronomy_json: JSON.stringify(c.agronomy || {}),
        pests_json: JSON.stringify(c.pests || []),
        resources_json: JSON.stringify(c.resources || []),
      });
      upserted++;
    }

    // Source-of-truth sync: drop any plants row that is NOT in the catalog.
    // This removes renamed/duplicated slugs (e.g. 'mung_bean' — a duplicate
    // of green_gram — and 'citrus', renamed to 'lemon') and guarantees a
    // crop removed from the catalog later can never linger as a stale card.
    const places = catalog.map(() => '?').join(', ');
    const removed = db
      .prepare(`DELETE FROM plants WHERE slug NOT IN (${places})`)
      .run(...catalog.map((c) => c.slug)).changes;

    return { plantsUpserted: upserted, staleRowsRemoved: removed };
  });

  return apply();
}

module.exports = { up };
