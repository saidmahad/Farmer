// db/migrations/008_fix_disease_images.js
// Fixes the Disease Library image mappings in the LIVE database:
//
//   - Two diseases shared one Unsplash photo (pink bollworm / cotton
//     whitefly; tomato late blight / leaf curl; fall armyworm / N
//     deficiency) — each now gets its own disease-specific image.
//   - Two URLs were dead (404): rice blast and tikka leaf spot, which the
//     UI rendered as broken-image placeholders.
//
// Strategy: UPDATE only the image_url column by slug — no row replacement —
// so user-visible catalog text and any user-created rows are untouched.
//
// Image policy mirrors 003/006 (see 003 header): Wikimedia Commons photos
// whose FILENAME describes the subject, resolved and existence-verified via
// the Commons API (prop=imageinfo). Idempotent: the UPDATE targets the old
// broken/duplicated URLs, so re-running is a no-op once applied.

function tableExists(db, name) {
  return Boolean(
    db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name)
  );
}

// slug -> { to, reason } — `from` is asserted so a drifted DB fails loudly
// instead of silently overwriting a good image.
const FIXES = [
  {
    slug: 'rice-blast',
    to: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Rice_blast_symptoms.jpg/960px-Rice_blast_symptoms.jpg',
    from: 'https://images.unsplash.com/photo-1530507629858-e3759c1e0d1b?w=400&h=300&fit=crop',
    reason: 'dead URL (404) — replaced with Commons "Rice blast symptoms.jpg"',
  },
  {
    slug: 'wheat-yellow-rust',
    to: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Stripe_rust_on_wheat.jpg',
    from: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop',
    reason: 'opaque Unsplash ID — replaced with Commons "Stripe rust on wheat.jpg"',
  },
  {
    slug: 'tomato-late-blight',
    to: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Phytophthora_infestans_%28late_blight%29_on_tomato.jpg/960px-Phytophthora_infestans_%28late_blight%29_on_tomato.jpg',
    from: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=300&fit=crop',
    reason: 'duplicated with tomato-leaf-curl-virus — dedicated late-blight symptom photo',
  },
  {
    slug: 'cotton-pink-bollworm',
    to: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Pectinophora_gossypiella_1265079.jpg',
    from: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop',
    reason: 'duplicated with cotton-whitefly — dedicated Pectinophora gossypiella photo',
  },
  {
    slug: 'maize-fall-armyworm',
    to: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Spodoptera_frugiperda.jpg',
    from: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop',
    reason: 'duplicated with maize-nutrient-deficiency — dedicated Spodoptera frugiperda photo',
  },
  {
    slug: 'groundnut-tikka-leaf-spot',
    to: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Sporulating_Cercospora_on_groundnut_leaf_tissue_%E2%80%93_400x.jpg',
    from: 'https://images.unsplash.com/photo-1567892320421-2c45ca7c2238?w=400&h=300&fit=crop',
    reason: 'dead URL (404) — replaced with Commons Cercospora-on-groundnut photo (tikka leaf spot pathogen)',
  },
  {
    slug: 'onion-purple-blotch',
    to: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Alternaria_porri.jpg',
    from: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop',
    reason: 'opaque Unsplash ID — replaced with Commons "Alternaria porri.jpg" (purple blotch pathogen)',
  },
  {
    slug: 'sugarcane-red-rot',
    to: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Sugarcane.jpg',
    from: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400&h=300&fit=crop',
    reason: 'opaque Unsplash ID — no verified red-rot symptom photo exists; correct-crop fallback',
  },
  {
    slug: 'cotton-whitefly',
    to: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Silverleaf_whitefly.jpg',
    from: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop',
    reason: 'duplicated with cotton-pink-bollworm — dedicated Bemisia tabaci (silverleaf whitefly) photo',
  },
  {
    slug: 'tomato-leaf-curl-virus',
    to: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Tomato_leaf_curl_Taiwan_virus.jpg',
    from: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=300&fit=crop',
    reason: 'duplicated with tomato-late-blight — dedicated leaf-curl symptom photo',
  },
  {
    slug: 'rice-bph',
    to: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/BPH_damage2.jpg/960px-BPH_damage2.jpg',
    from: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
    reason: 'opaque Unsplash ID — replaced with Commons BPH hopperburn damage on rice photo',
  },
  {
    slug: 'maize-nutrient-deficiency',
    to: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/K-deficient_maize_on_Cedara_4_2003-01-13.jpg/960px-K-deficient_maize_on_Cedara_4_2003-01-13.jpg',
    from: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop',
    reason: 'duplicated with maize-fall-armyworm — dedicated maize nutrient-deficiency symptom photo',
  },
];

function up(db) {
  if (!tableExists(db, 'diseases')) {
    return { fixed: 0, tableExists: false };
  }

  const select = db.prepare('SELECT image_url FROM diseases WHERE slug = ?');
  const update = db.prepare('UPDATE diseases SET image_url = ? WHERE slug = ?');

  let fixed = 0;
  const skipped = [];
  for (const fix of FIXES) {
    const row = select.get(fix.slug);
    if (!row) {
      skipped.push(`${fix.slug}: row missing`);
      continue;
    }
    if (row.image_url === fix.to) {
      continue; // already applied — idempotent
    }
    if (fix.from && row.image_url !== fix.from) {
      // Not the expected old URL and not already the new one: report, don't
      // clobber an image someone else has intentionally changed.
      skipped.push(`${fix.slug}: unexpected current URL (${String(row.image_url).slice(0, 80)})`);
      continue;
    }
    update.run(fix.to, fix.slug);
    fixed++;
  }

  return { fixed, skipped };
}

module.exports = { up };
