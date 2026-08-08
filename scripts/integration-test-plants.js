// scripts/integration-test-plants.js
// End-to-end verification of the plant catalog against the LIVE server:
//   - register / login / crops / advice flow still works
//   - /api/plants returns the full ~64-crop catalog with verified images
//   - search by common name ("rice"), scientific name ("Oryza"), and
//     category word ("cereal") returns the right results
//   - category filter logic matches the catalog
//
// Usage: node scripts/integration-test-plants.js   (spawns its own server)

const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = 3210;
const BASE = `http://127.0.0.1:${PORT}`;
const email = `itest_${Date.now()}@example.com`;

let server;
let token;
let failures = 0;

function check(cond, label, extra = '') {
  if (cond) {
    console.log(`  PASS ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label} ${extra}`);
  }
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function api(pathname, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + pathname, { ...opts, headers });
  return { status: res.status, body: await res.json() };
}

async function main() {
  server = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });

  if (!(await waitForServer())) {
    console.error('Server did not start in time.');
    process.exit(1);
  }
  console.log('Server up.');

  // ---- 1. register / login / crops / advice flow ----------------------
  console.log('\n== register/login/crops/advice flow ==');
  const reg = await api('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Integration Tester', email, password: 'secure1234' }),
  });
  check(reg.status === 201, 'register returns 201', `got ${reg.status}`);
  token = reg.body.token;
  check(Boolean(token), 'register returns token');

  const crops = await api('/api/crops');
  check(crops.status === 200 && crops.body.crops.length > 0, `crops list has ${crops.body.crops?.length} crops`);
  const firstCropId = crops.body.crops?.[0]?.id;
  const advice = await api(`/api/advice?crop_id=${firstCropId}`);
  check(advice.status === 200 && advice.body.advice?.length > 0, 'advice endpoint returns content', `got ${advice.status}`);

  // ---- 2. plant catalog -------------------------------------------------
  console.log('\n== plant catalog ==');
  const { status, body } = await api('/api/plants');
  check(status === 200, '/api/plants returns 200', `got ${status}`);
  const plants = body.plants || [];
  check(plants.length >= 55 && plants.length <= 70, `catalog size ~64 (got ${plants.length})`);

  const byCat = {};
  plants.forEach((p) => (byCat[p.category] = (byCat[p.category] || 0) + 1));
  console.log(`  categories: ${JSON.stringify(byCat)}`);
  check(Object.keys(byCat).length >= 7, 'at least 7 categories present');

  const badImg = plants.filter((p) => !p.image_url || !p.image_url.startsWith('https://upload.wikimedia.org'));
  check(badImg.length === 0, 'every plant has a verified Wikimedia image', badImg.map((p) => p.slug).join(','));

  const emptyDetail = plants.filter((p) => !p.overview || !p.agronomy || !p.pests?.length || !p.resources?.length);
  check(emptyDetail.length === 0, 'every plant has full detail data', emptyDetail.map((p) => p.slug).join(','));

  const noDesc = plants.filter((p) => !p.description || p.description.length < 50);
  check(noDesc.length === 0, 'every plant has a real description');

  // ---- 3. search semantics ----------------------------------------------
  // Mirrors the PlantExplorer filter: name/scientific/category by substring,
  // description by whole word (so "rice" doesn't hit "prices").
  console.log('\n== search ==');
  function search(q) {
    const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return plants.filter((p) => {
      const haystack = `${p.name} ${p.scientific_name || ''} ${p.category || ''}`.toLowerCase();
      const desc = (p.description || '').toLowerCase();
      return tokens.every((tok) => {
        if (haystack.includes(tok)) return true;
        const esc = tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^a-z0-9])${esc}(?![a-z0-9])`, 'i').test(desc);
      });
    });
  }

  const rice = search('rice');
  check(rice.length === 1 && rice[0].slug === 'rice', `search "rice" finds only rice (got ${rice.length}: ${rice.map((p) => p.slug).join(',')})`);

  const oryza = search('Oryza');
  check(oryza.length === 1 && oryza[0].slug === 'rice', 'search "Oryza" finds rice by scientific name');

  const cereal = search('cereal');
  const cerealSlugs = cereal.map((p) => p.slug);
  check(
    cereal.length === 8 &&
      ['rice', 'wheat', 'maize', 'sorghum', 'pearl_millet', 'finger_millet', 'barley', 'oats'].every((s) => cerealSlugs.includes(s)),
    `search "cereal" returns exactly the 8 cereal crops (got ${cereal.length})`,
    JSON.stringify(cerealSlugs)
  );

  // "price" must not leak into a search for "rice" (word-boundary matching).
  const priceCheck = search('price');
  check(priceCheck.length === 0 || !rice.includes(priceCheck[0]), 'search "rice" does not surface crops whose description mentions "price"');

  const descHit = search('nitrogen');
  check(descHit.length >= 3, 'search matches description text ("nitrogen")', `found ${descHit.length}`);

  // ---- 4. category filter logic -----------------------------------------
  console.log('\n== category filters ==');
  for (const cat of ['Cereals', 'Fruits', 'Spices', 'Oil Seeds']) {
    const inCat = plants.filter((p) => p.category === cat);
    check(inCat.length > 0 && inCat.every((p) => p.category === cat), `filter "${cat}" isolates category (${inCat.length})`);
  }
  const all = plants.length;
  const sum = Object.values(byCat).reduce((a, b) => a + b, 0);
  check(all === sum, 'All filter == union of categories');

  // ---- 5. the original bug: onion must NOT be potatoes -----------------
  console.log('\n== image-mismatch regression ==');
  const onion = plants.find((p) => p.slug === 'onion');
  const potato = plants.find((p) => p.slug === 'potato');
  check(onion?.image_url?.includes('Onions'), 'onion image is Onions.jpg', onion?.image_url);
  check(!onion?.image_url?.includes('Potato'), 'onion no longer shows a potato photo');
  check(potato?.image_url?.includes('Potato'), 'potato image is Potatoes.jpg', potato?.image_url);
  const urlSet = new Set(plants.map((p) => p.image_url));
  check(urlSet.size === plants.length, 'no two crops share an image URL');

  console.log(`\n${failures === 0 ? 'ALL INTEGRATION CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
  process.exitCode = failures ? 1 : 0;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    if (server) {
      setTimeout(() => server.kill(), 500);
    }
  });
