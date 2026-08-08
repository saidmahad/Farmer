// scripts/resolve-commons-images.js
//
// Resolves verified Wikimedia Commons image URLs for the ENTIRE plant
// catalog (every slug in db/catalog/plant-catalog.json).
//
// Why Commons: Unsplash photo IDs are opaque hashes — you cannot tell what
// a photo shows from its URL, which is exactly how the Onion→potato bug
// (and the duplicated-image mess) happened. Commons files have descriptive
// filenames ("Red onions.jpg"), so a URL can be checked against its subject.
//
// Method: the Commons API resolves up to 50 File: titles in one request
// (prop=imageinfo), returning the canonical 960px thumb URL for every file
// that exists. We run one round per candidate priority, so the whole
// catalog resolves in a handful of API calls. Requests are paced and 429s
// are retried with backoff.
//
// Usage:  node scripts/resolve-commons-images.js
// Output: db/catalog/commons-images.json  { slug: { file, url } }
//         plus a report of any crops that failed to resolve.
//
// This is the image-assignment verification step: every URL written here
// comes from a File: title whose name literally describes the crop (e.g.
// "Allium cepa.jpg" for onion), and scripts/audit-plant-catalog.js then
// verifies each URL loads (HTTP 200) before it is written to the database.

const fs = require('node:fs');
const path = require('node:path');

const UA =
  'Agri-Advisor-Catalog/1.0 (crop catalog maintenance; node script)';

// Every catalog slug, with candidate File: titles in priority order.
// Candidate names must DESCRIBE THE SUBJECT of the photo — the filename
// is the verification: a file called "Allium cepa.jpg" cannot be potatoes.
const CANDIDATES = {
  // ---- Cereals ----
  rice: ['Oryza sativa.jpg', 'Rice plants (Oryza sativa).jpg', 'Rice grains (Oryza sativa).jpg', 'Paddy field.jpg'],
  wheat: ['Wheat field.jpg', 'Triticum aestivum.jpg', 'Wheat ears.jpg', 'Weizenfeld.jpg'],
  maize: ['Corncobs.jpg', 'Maize (Zea mays).jpg', 'Zea mays.jpg', 'Corn on the cob.jpg'],
  sorghum: ['Sorghum bicolor.jpg', 'Sorghum grains.jpg', 'Sorghum.jpg'],
  pearl_millet: ['Pennisetum glaucum.jpg', 'Pearl millet.jpg', 'Bajra.jpg'],
  finger_millet: ['Finger millet.jpg', 'Eleusine coracana.jpg', 'Ragi.jpg'],
  barley: ['Barley.jpg', 'Hordeum vulgare.jpg', 'Barley ears.jpg'],
  oats: ['Avena sativa.jpg', 'Oats.jpg', 'Oat grains.jpg', 'Oat field.jpg'],
  // ---- Pulses ----
  chickpea: ['Chickpeas.jpg', 'Cicer arietinum.jpg', 'Chickpea.jpg'],
  pigeon_pea: ['Pigeon peas.jpg', 'Cajanus cajan.jpg', 'Pigeon pea.jpg'],
  green_gram: ['Mung beans.jpg', 'Vigna radiata.jpg', 'Green gram.jpg', 'Moong dal.jpg'],
  black_gram: ['Black gram.jpg', 'Vigna mungo.jpg', 'Urad dal.jpg'],
  lentil: ['Lentils.jpg', 'Lens culinaris.jpg', 'Lentil.jpg'],
  cowpea: ['Cowpeas.jpg', 'Vigna unguiculata.jpg', 'Cowpea.jpg'],
  // ---- Oil Seeds ----
  groundnut: ['Peanuts.jpg', 'Arachis hypogaea.jpg', 'Groundnut.jpg'],
  soybean: ['Soybeans.jpg', 'Glycine max.jpg', 'Soybean.jpg'],
  mustard: ['Brassica juncea.jpg', 'Mustard flowers.jpg', 'Yellow mustard field.jpg'],
  sesame: ['Sesame seeds.jpg', 'Sesamum indicum.jpg', 'Sesame.jpg'],
  sunflower: ['Sunflowers.jpg', 'Helianthus annuus.jpg', 'Sunflower field.jpg'],
  castor: ['Ricinus communis.jpg', 'Castor beans.jpg', 'Castor seeds.jpg'],
  linseed: ['Linum usitatissimum.jpg', 'Flax.jpg', 'Flax seeds.jpg'],
  // ---- Vegetables ----
  tomato: ['Tomatoes.jpg', 'Solanum lycopersicum.jpg', 'Tomato.jpg'],
  onion: ['Onions.jpg', 'Red onions.jpg', 'Allium cepa.jpg'],
  potato: ['Potatoes.jpg', 'Solanum tuberosum.jpg', 'Potato.jpg'],
  garlic: ['Garlic.jpg', 'Allium sativum.jpg'],
  okra: ['Okra.jpg', 'Abelmoschus esculentus.jpg', "Lady's fingers.jpg"],
  brinjal: ['Eggplant.jpg', 'Aubergine.jpg', 'Solanum melongena.jpg'],
  cauliflower: ['Cauliflower.jpg', 'Brassica oleracea var. botrytis.jpg'],
  cabbage: ['Cabbage.jpg', 'Brassica oleracea var. capitata.jpg'],
  carrot: ['Carrots.jpg', 'Daucus carota.jpg', 'Carrot.jpg'],
  peas: ['Peas.jpg', 'Pisum sativum.jpg', 'Green peas.jpg'],
  capsicum: ['Bell peppers.jpg', 'Capsicum annuum.jpg', 'Green bell peppers.jpg'],
  chili: ['Chili peppers.jpg', 'Red chillies.jpg', 'Chilli peppers.jpg', 'Capsicum annuum.jpg'],
  cucumber: ['Cucumbers.jpg', 'Cucumis sativus.jpg', 'Cucumber.jpg'],
  bitter_gourd: ['Bitter melon.jpg', 'Momordica charantia.jpg', 'Bitter gourd.jpg'],
  bottle_gourd: ['Bottle gourd.jpg', 'Lagenaria siceraria.jpg', 'Lauki.jpg'],
  ridge_gourd: ['Ridge gourd.jpg', 'Luffa acutangula.jpg', 'Luffa.jpg'],
  pumpkin: ['Pumpkins.jpg', 'Cucurbita moschata.jpg', 'Pumpkin.jpg'],
  sweet_potato: ['Sweet potatoes.jpg', 'Ipomoea batatas.jpg', 'Sweet potato.jpg'],
  yam: ['Dioscorea alata.jpg', 'Yams.jpg', 'Dioscorea yam.jpg', 'Yam.jpg'],
  // ---- Spices ----
  turmeric: ['Turmeric.jpg', 'Curcuma longa.jpg', 'Turmeric roots.jpg'],
  ginger: ['Ginger.jpg', 'Zingiber officinale.jpg'],
  cardamom: ['Cardamom.jpg', 'Elettaria cardamomum.jpg', 'Green cardamom.jpg'],
  black_pepper: ['Black pepper.jpg', 'Piper nigrum.jpg', 'Peppercorns.jpg'],
  coriander: ['Coriander.jpg', 'Coriandrum sativum.jpg', 'Cilantro.jpg'],
  cumin: ['Cumin seeds.jpg', 'Cuminum cyminum.jpg', 'Cumin.jpg'],
  // ---- Cash Crops ----
  sugarcane: ['Sugarcane.jpg', 'Saccharum officinarum.jpg', 'Sugarcane field.jpg'],
  cotton: ['Cotton plant.jpg', 'Gossypium.jpg', 'Cotton field.jpg', 'Cotton boll.jpg'],
  tea: ['Tea plantation.jpg', 'Camellia sinensis.jpg', 'Tea leaves.jpg'],
  coffee: ['Coffee beans.jpg', 'Coffea arabica.jpg', 'Coffee cherries.jpg'],
  rubber: ['Hevea brasiliensis.jpg', 'Rubber tapping.jpg', 'Rubber tree.jpg'],
  tobacco: ['Nicotiana tabacum.jpg', 'Tobacco field.jpg', 'Tobacco plants.jpg'],
  jute: ['Jute.jpg', 'Corchorus olitorius.jpg', 'Jute field.jpg'],
  // ---- Fruits ----
  apple: ['Apples.jpg', 'Malus domestica.jpg', 'Apple.jpg'],
  banana: ['Bananas.jpg', 'Musa acuminata.jpg', 'Banana.jpg'],
  grapes: ['Grapes.jpg', 'Vitis vinifera.jpg'],
  mango: ['Mango.jpg', 'Mangifera indica.jpg', 'Mangoes.jpg'],
  orange: ['Oranges.jpg', 'Citrus sinensis.jpg', 'Orange.jpg'],
  papaya: ['Papaya.jpg', 'Carica papaya.jpg', 'Papayas.jpg'],
  guava: ['Guava.jpg', 'Psidium guajava.jpg', 'Guavas.jpg'],
  pomegranate: ['Pomegranate.jpg', 'Punica granatum.jpg', 'Pomegranates.jpg'],
  watermelon: ['Watermelons.jpg', 'Citrullus lanatus.jpg', 'Watermelon.jpg'],
  lemon: ['Lemons.jpg', 'Citrus limon.jpg', 'Lemon.jpg'],
  // ---- Fiber Crops ----
  sisal: ['Agave sisalana.jpg', 'Sisal.jpg', 'Sisal plant.jpg'],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The MediaWiki API accepts at most 50 titles per request. Chunking keeps
// every batch under the limit no matter how large the catalog grows.
const TITLES_PER_REQUEST = 50;

// Batch-resolve File: titles -> { title: { file, url } | null }
async function batchResolve(titles) {
  const byTitle = new Map();
  for (let i = 0; i < titles.length; i += TITLES_PER_REQUEST) {
    const chunk = titles.slice(i, i + TITLES_PER_REQUEST);
    const map = await resolveChunk(chunk);
    for (const [k, v] of map) byTitle.set(k, v);
    if (i + TITLES_PER_REQUEST < titles.length) await sleep(600);
  }
  return byTitle;
}

async function resolveChunk(chunk) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('redirects', '1');
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url');
  url.searchParams.set('iiurlwidth', '960');
  url.searchParams.set('titles', chunk.join('|'));

  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      await sleep(1500 * 2 ** attempt);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} from Commons API`);
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});
    const byTitle = new Map();
    for (const p of pages) {
      if (p.missing || !p.imageinfo || !p.imageinfo[0]) {
        byTitle.set(p.title, null);
      } else {
        const info = p.imageinfo[0];
        // Prefer the 960px thumb (smaller payload for cards); fall back to
        // the original URL for files smaller than 960px.
        const url2 = (info.thumburl || info.url).replace(/[?&]utm_source=.*$/, '');
        // `file` is the File: title from the page object (p.title) — the
        // descriptive filename is what makes the URL auditable against the
        // crop name, so we store it alongside the URL.
        byTitle.set(p.title, { file: p.title, url: url2 });
      }
    }
    return byTitle;
  }
  throw new Error('Commons API kept returning 429');
}

async function main() {
  const slugs = Object.keys(CANDIDATES);
  const results = {}; // slug -> { file, url }
  const remaining = new Set(slugs);

  for (let priority = 0; priority < 4 && remaining.size; priority++) {
    const batch = [];
    for (const slug of remaining) {
      const fn = CANDIDATES[slug][priority];
      if (fn) batch.push(`File:${fn}`);
    }
    if (!batch.length) break;

    const map = await batchResolve(batch);
    await sleep(600);

    for (const slug of [...remaining]) {
      const fn = CANDIDATES[slug][priority];
      const hit = map.get(`File:${fn}`);
      if (hit) {
        results[slug] = hit;
        remaining.delete(slug);
        console.log(`OK   ${slug.padEnd(14)} ${hit.file}`);
      }
    }
    if (priority < 3 && remaining.size) {
      console.log(`(round ${priority + 2}: ${remaining.size} crops still unresolved)`);
    }
  }

  for (const slug of remaining) {
    console.log(`FAIL ${slug.padEnd(14)} no candidate exists on Commons`);
  }

  const outPath = path.join(__dirname, '..', 'db', 'catalog', 'commons-images.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${Object.keys(results).length} resolved URLs -> ${outPath}`);
  if (remaining.size) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
