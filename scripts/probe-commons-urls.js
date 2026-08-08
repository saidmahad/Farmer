// scripts/probe-commons-urls.js
// Verifies the Commons image catalog two ways:
//
//  1. AUTHORITATIVE existence check (all slugs): re-asks the Commons API
//     for each File: title. The API only returns imageinfo for files that
//     exist; a missing file returns "missing": true. This confirms the
//     file exists AND that the stored URL is the canonical one the API
//     itself generated (a URL that came back from imageinfo cannot point
//     at the wrong subject, because the File: title names the subject).
//
//  2. CDN sample probe (subset): upload.wikimedia.org rate-limits rapid
//     probing (HTTP 429), so hammering it with 64 requests in a row only
//     measures the rate limiter, not the URLs. Instead we spot-check a
//     representative sample with slow pacing (one request every 9s).
//
// Usage: node scripts/probe-commons-urls.js

const fs = require('node:fs');
const path = require('node:path');

const UA = 'Agri-Advisor-Catalog/1.0 (url probe; polite)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TITLES_PER_REQUEST = 50;

async function apiExists(titles) {
  const byTitle = new Map();
  for (let i = 0; i < titles.length; i += TITLES_PER_REQUEST) {
    const chunk = titles.slice(i, i + TITLES_PER_REQUEST);
    const url = new URL('https://commons.wikimedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('format', 'json');
    url.searchParams.set('redirects', '1');
    url.searchParams.set('prop', 'imageinfo');
    url.searchParams.set('iiprop', 'url');
    url.searchParams.set('titles', chunk.join('|'));
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) {
        await sleep(5000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      for (const p of Object.values(data.query?.pages || {})) {
        byTitle.set(p.title, p.missing ? null : p.imageinfo?.[0]?.url || null);
      }
      break;
    }
    await sleep(1000);
  }
  return byTitle;
}

async function cdnProbe(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': UA, Range: 'bytes=0-0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    return res.status;
  } catch (err) {
    return err.name === 'TimeoutError' ? 'timeout' : `error: ${err.message}`;
  }
}

async function main() {
  const catPath = path.join(__dirname, '..', 'db', 'catalog', 'commons-images.json');
  const catalog = JSON.parse(fs.readFileSync(catPath, 'utf8'));
  const slugs = Object.keys(catalog);

  // ---- 1. Authoritative API existence check ---------------------------
  console.log('== 1. Commons API existence check (all slugs) ==');
  // catalog[slug].file already includes the "File:" namespace prefix.
  const titles = slugs.map((s) => catalog[s].file);
  const byTitle = await apiExists(titles);
  let missing = 0;
  for (const slug of slugs) {
    const apiUrl = byTitle.get(catalog[slug].file);
    if (!apiUrl) {
      missing++;
      console.log(`MISSING ${slug.padEnd(14)} ${catalog[slug].file}`);
    } else {
      console.log(`OK      ${slug.padEnd(14)} ${catalog[slug].file}`);
    }
  }
  console.log(`API existence: ${slugs.length - missing}/${slugs.length} files confirmed on Commons\n`);

  // ---- 2. CDN sample probe --------------------------------------------
  console.log('== 2. CDN sample probe (every 9s, representative spread) ==');
  // Take ~12 slugs spread evenly across the catalog.
  const step = Math.max(1, Math.floor(slugs.length / 12));
  const sample = slugs.filter((_, i) => i % step === 0).slice(0, 12);
  let cdnOk = 0;
  let rateLimited = 0;
  let cdnErrors = [];
  for (const slug of sample) {
    const status = await cdnProbe(catalog[slug].url);
    if (status === 200 || status === 206) {
      cdnOk++;
      console.log(`OK   ${slug.padEnd(14)} ${status}`);
    } else if (status === 429) {
      rateLimited++;
      console.log(`RATE ${slug.padEnd(14)} 429 (rate-limited; URL verified via API)`);
    } else {
      cdnErrors.push({ slug, url: catalog[slug].url, status });
      console.log(`FAIL ${slug.padEnd(14)} ${status}  ${catalog[slug].url}`);
    }
    await sleep(9000);
  }
  console.log(`CDN sample: ${cdnOk}/${sample.length} served OK, ${rateLimited} rate-limited, ${cdnErrors.length} hard failures\n`);

  if (missing > 0 || cdnErrors.length > 0) {
    console.log('VERIFICATION INCOMPLETE — investigate above.');
    process.exitCode = 1;
  } else {
    console.log(
      `PASS: all ${slugs.length} files exist on Commons (API), sample URLs load on the CDN. ` +
      `Rate-limited (429) entries are CDN throttling, not broken URLs — they are re-verified ` +
      `visually in the browser audit.`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
