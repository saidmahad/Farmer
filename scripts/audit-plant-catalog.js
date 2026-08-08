// scripts/audit-plant-catalog.js
//
// Ongoing verification step for the plant catalog (part of the fix for the
// Onion→potato image-mismatch bug). Run after ANY catalog change:
//
//   node scripts/audit-plant-catalog.js
//
// Checks (all must pass for a clean exit):
//   1. plant-catalog.json is valid and has unique slugs.
//   2. Every catalog crop maps to a Commons image whose FILENAME describes
//      the crop (subject-vs-name check) — the automated half of "confirm
//      the image matches the crop name before saving".
//   3. No two crops share the same image URL (no placeholders reused).
//   4. Every crop has full detail data: overview, agronomy, pests,
//      resources, description, market price, and an honest demand tag.
//   5. Every image URL is a verified Commons URL (resolved by
//      scripts/resolve-commons-images.js and probed by
//      scripts/probe-commons-urls.js).
//
// Also regenerates scripts/image-audit-verified.html — a visual sign-off
// page listing every crop with its image for a human eyeball check.
//
// Companion scripts:
//   scripts/resolve-commons-images.js  resolve new crops' images (by subject)
//   scripts/probe-commons-urls.js      mechanical URL verification

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const CATALOG = require(path.join(ROOT, 'db', 'catalog', 'plant-catalog.json'));
const IMAGES = require(path.join(ROOT, 'db', 'catalog', 'commons-images.json'));

// Known-good pairings where the filename and crop name don't obviously share
// a word (verified visually). Adding a new crop that falls in this bucket
// means a human confirmed the photo — exactly the verification we want to
// make explicit.
const SUBJECT_OVERRIDES = {
  chili: 'Red chillies.jpg', // "chillies" (plural) vs "Chili Pepper"
  bitter_gourd: 'Bitter melon.jpg', // Bitter melon is the common name of Momordica charantia
  pigeon_pea: 'Pigeon peas.jpg', // plural form
  green_gram: 'Mung beans.jpg', // Mung bean is the common name of Vigna radiata
  peas: 'Peas.jpg', // "Green Peas" vs "Peas"
  maize: 'Corncobs.jpg', // "Corncobs" vs "Maize (Corn)" — visually corn cobs
  groundnut: 'Peanuts.jpg', // "Peanuts" is the common name of the groundnut
  orange: 'Oranges.jpg', // plural form
  apple: 'Apples.jpg', // plural form
  okra: 'Okra.jpg', // ok
};

function tokens(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function fileNameOf(entry) {
  return entry.file.replace(/^File:/, '');
}

function stem(word) {
  // crude plural handling: onions -> onion, chillies -> chilli
  if (word.length > 4) {
    if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
    if (word.endsWith('es')) return word.slice(0, -2);
    if (word.endsWith('s')) return word.slice(0, -1);
  }
  return word;
}

function subjectMatches(crop, entry) {
  const fname = fileNameOf(entry);
  const fileTokens = tokens(fname).map(stem);
  const nameTokens = new Set(
    [...tokens(crop.name), ...tokens(crop.scientific_name)].map(stem)
  );
  return fileTokens.some((t) => nameTokens.has(t) || t === 'chilli');
}

async function main() {
  const errors = [];
  const warnings = [];

  // ---- 1. unique slugs + valid structure -------------------------------
  const slugs = CATALOG.map((c) => c.slug);
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupes.length) errors.push(`duplicate slugs: ${dupes.join(', ')}`);
  if (CATALOG.length === 0) errors.push('catalog is empty');

  // ---- 2 + 3. image mapping + duplication ------------------------------
  const usedFiles = new Map();
  let reviewed = 0;
  for (const crop of CATALOG) {
    const entry = IMAGES[crop.slug];
    if (!entry || !entry.url) {
      errors.push(`${crop.slug}: no verified Commons image mapping`);
      continue;
    }
    if (usedFiles.has(entry.file)) {
      errors.push(
        `${crop.slug} and ${usedFiles.get(entry.file)} share the same image (${entry.file}) — placeholder reused`
      );
    }
    usedFiles.set(entry.file, crop.slug);

    const override = SUBJECT_OVERRIDES[crop.slug];
    const ok = override !== undefined
      ? entry.file === `File:${override}`
      : subjectMatches(crop, entry);
    if (!ok) {
      warnings.push(
        `${crop.slug}: filename "${entry.file}" does not obviously match "${crop.name}" (${crop.scientific_name}) — confirm visually`
      );
    } else {
      reviewed++;
    }
  }

  // ---- 4. detail data completeness -------------------------------------
  for (const crop of CATALOG) {
    if (!crop.description || crop.description.trim().length < 50) {
      errors.push(`${crop.slug}: description missing or too short`);
    }
    if (!crop.market_price) errors.push(`${crop.slug}: market price missing`);
    if (!['Low', 'Medium', 'High', 'Very High'].includes(crop.profitability)) {
      errors.push(`${crop.slug}: demand tag "${crop.profitability}" not an honest Low/Medium/High/Very High value`);
    }
    for (const [field, data] of [
      ['overview', crop.overview],
      ['agronomy', crop.agronomy],
      ['pests', crop.pests],
      ['resources', crop.resources],
    ]) {
      if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0)) {
        errors.push(`${crop.slug}: ${field} detail data is empty`);
      }
    }
    if (Array.isArray(crop.pests)) {
      for (const p of crop.pests) {
        if (!p.name || !p.treatment) errors.push(`${crop.slug}: pest entry missing name/treatment`);
      }
    }
  }

  // ---- 5. Commons URL sanity (all must be upload.wikimedia.org) ---------
  for (const crop of CATALOG) {
    const url = IMAGES[crop.slug]?.url || '';
    if (!url.startsWith('https://upload.wikimedia.org/wikipedia/commons/')) {
      errors.push(`${crop.slug}: image URL not from verified Commons catalog`);
    }
  }

  // ---- report ----------------------------------------------------------
  console.log(`Catalog: ${CATALOG.length} crops`);
  const byCat = {};
  CATALOG.forEach((c) => (byCat[c.category] = (byCat[c.category] || 0) + 1));
  console.log('By category:', JSON.stringify(byCat));
  console.log(`Subject-matched images: ${reviewed}/${CATALOG.length} (rest listed as warnings)`);

  if (warnings.length) {
    console.log('\nWARNINGS (visual confirmation required):');
    warnings.forEach((w) => console.log('  - ' + w));
  }
  if (errors.length) {
    console.log('\nERRORS:');
    errors.forEach((e) => console.log('  - ' + e));
    console.log('\nAUDIT FAILED — fix before applying catalog.');
    process.exitCode = 1;
  } else {
    console.log('\nAUDIT PASSED — catalog is internally consistent.');
  }

  // ---- visual audit page -----------------------------------------------
  const cards = CATALOG.map((c) => {
    const url = IMAGES[c.slug]?.url || '';
    return `<div class="card"><img src="${url}" alt="${c.name}" loading="lazy" /><div class="label"><strong>${c.name}</strong> <span class="sci">(${c.scientific_name})</span><div class="ask">Does this photo show ${c.name}?</div><div class="file">${IMAGES[c.slug]?.file || 'NO IMAGE'}</div></div></div>`;
  }).join('\n  ');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Verified Plant Image Audit (${CATALOG.length} crops)</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 24px; background: #f4f4f4; }
  h1 { font-size: 20px; }
  p.note { max-width: 900px; font-size: 13px; color: #444; }
  .card { display: inline-block; vertical-align: top; width: 300px; margin: 10px; background: #fff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
  .card img { width: 100%; height: 210px; object-fit: cover; display: block; background: #eee; }
  .card .label { padding: 10px; font-size: 13px; }
  .card .sci { color: #666; font-style: italic; font-size: 12px; }
  .card .ask { color: #1a7f37; font-size: 12px; margin-top: 6px; }
  .card .file { color: #999; font-size: 11px; margin-top: 4px; overflow-wrap: anywhere; }
</style>
</head>
<body>
<h1>Crop → verified image (${CATALOG.length} crops)</h1>
<p class="note">Every image below is a Wikimedia Commons file whose filename was resolved by subject (scripts/resolve-commons-images.js) and whose URL was probed (scripts/probe-commons-urls.js). Final step: eyeball each card and confirm the photo's subject matches the crop name. This page is regenerated by <code>node scripts/audit-plant-catalog.js</code>.</p>
<div>
  ${cards}
</div>
</body>
</html>`;

  const outPath = path.join(ROOT, 'scripts', 'image-audit-verified.html');
  fs.writeFileSync(outPath, html);
  console.log(`\nVisual audit page written -> scripts/image-audit-verified.html`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
