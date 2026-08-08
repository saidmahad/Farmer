// db/migrations/007_seed_crops_from_catalog.js
//
// Mirrors the verified plant catalog (db/catalog/plant-catalog.json) into
// the legacy `crops` table, so the classic /api/crops + /api/advice flow
// (Crop Recommendation, Growth Calendar) works on a FRESH database — where
// the old hand-seeded Somali crops no longer exist.
//
// The legacy `crops` columns are mapped from the catalog's richer fields:
//   crop_name       <- name
//   local_name      <- scientific_name
//   season          <- season
//   planting_method <- agronomy.land_prep
//   irrigation      <- agronomy.irrigation
//   fertilizer      <- agronomy.fertilizer
//   common_pests    <- pests[].name (joined)
//   days_to_harvest <- duration
//
// Idempotent: upserts on the unique crop_name (ON CONFLICT DO UPDATE).
// Existing legacy rows NOT in the catalog (Galley, Qamadi, …) are left
// untouched, per the data decision in migration 001.

const fs = require('node:fs');
const path = require('node:path');

const CATALOG_PATH = path.join(__dirname, '..', 'catalog', 'plant-catalog.json');

function tableExists(db, name) {
  return Boolean(
    db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name)
  );
}

function up(db) {
  if (!tableExists(db, 'crops')) {
    throw new Error('crops table missing — run the base-schema bootstrap first.');
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

  const upsert = db.prepare(`
    INSERT INTO crops
      (crop_name, local_name, season, planting_method, irrigation, fertilizer,
       common_pests, days_to_harvest)
    VALUES
      (@crop_name, @local_name, @season, @planting_method, @irrigation, @fertilizer,
       @common_pests, @days_to_harvest)
    ON CONFLICT(crop_name) DO UPDATE SET
      local_name = excluded.local_name,
      season = excluded.season,
      planting_method = excluded.planting_method,
      irrigation = excluded.irrigation,
      fertilizer = excluded.fertilizer,
      common_pests = excluded.common_pests,
      days_to_harvest = excluded.days_to_harvest
  `);

  const apply = db.transaction(() => {
    let upserted = 0;
    for (const c of catalog) {
      const agronomy = c.agronomy || {};
      const pests = Array.isArray(c.pests) ? c.pests : [];
      upsert.run({
        crop_name: c.name,
        local_name: c.scientific_name || null,
        season: c.season || null,
        // crops.planting_method / irrigation / fertilizer are NOT NULL — fall
        // back to '' rather than letting an incomplete catalog entry crash
        // the whole migration (and thus the deploy).
        planting_method: agronomy.land_prep || c.description || '',
        irrigation: agronomy.irrigation || c.water_need || '',
        fertilizer: agronomy.fertilizer || '',
        common_pests: pests.map((p) => p.name).filter(Boolean).join(', ') || null,
        days_to_harvest: c.duration || null,
      });
      upserted++;
    }
    return { cropsUpserted: upserted };
  });

  return apply();
}

module.exports = { up };
