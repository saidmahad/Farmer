// db/migrations/002_seed_figma_catalog.js
// Seeds the Figma-style crop catalog into the live app.
//
// Two tables are populated:
//   - crops  (the legacy flat shape used by /api/crops and /api/advice)
//            — these rows drive CropRecommendation + the existing
//              register/login/advice flow that must stay intact.
//   - plants (the new rich shape used by PlantExplorer)
//            — same crops plus overview/agronomy/pests/resources as JSON.
//
// Idempotent: every INSERT uses INSERT OR REPLACE on the unique key
// (crop_name / slug) so re-running this migration refreshes in place.

function tableExists(db, name) {
  return Boolean(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
      .get(name)
  );
}

// Figma catalog rows. The flat shape is what the live app's /api/crops
// and /api/advice endpoints already expect, so adding them here keeps
// the existing flow working. The rich shape lands in the new plants
// table for PlantExplorer to consume.
//
// Sources: data lifted from the Figma Make source's PlantExplorer +
// CropRecommendation components (rice, wheat, maize, sugarcane, tomato,
// cotton) plus the rest of the Indian/African staple set to round out
// the catalog.
const FIGMA_CROPS = [
  {
    crop_name: 'Rice (Paddy)',
    local_name: 'Rice',
    season: 'Kharif (Jun–Oct); year-round under irrigation',
    planting_method:
      'Transplant 21–25 day seedlings into puddled fields at 20x15 cm spacing, ' +
      '2–3 cm depth. Pre-germinate seed in a nursery and prepare a fine, level ' +
      'puddled main field with 5–10 cm standing water at transplanting.',
    irrigation:
      'Continuously flooded at 2–5 cm depth during vegetative stage, ' +
      'alternating wet/dry during tillering to save water. Stop irrigation ' +
      '10–14 days before harvest to aid ripening.',
    fertilizer:
      'NPK 120:60:40 kg/ha. Apply full P and K plus 50% N as basal; top-dress ' +
      'remaining N at active tillering and panicle initiation. Supplement ' +
      'with Zn and Fe if deficiency symptoms appear.',
    common_pests: 'Brown plant hopper, stem borer, rice blast, sheath blight',
    days_to_harvest: '120–150 days after transplanting',
  },
  {
    crop_name: 'Wheat',
    local_name: 'Wheat',
    season: 'Rabi (Nov–Apr)',
    planting_method:
      'Drill seed in rows 20 cm apart at 3–5 cm depth; seed rate ~120 kg/ha. ' +
      'A fine, level, firm seedbed with residual moisture gives the best ' +
      'germination. Late sowing after mid-December costs yield — every day lost ' +
      'is ~1% yield gone.',
    irrigation:
      '5–6 irrigations: crown root initiation (21 DAS), tillering, late ' +
      'jointing, flowering, grain filling, and dough stage. Critical water ' +
      'stages are flowering and grain filling.',
    fertilizer:
      'NPK 120:60:40 kg/ha. Full P and K plus half N at sowing; remaining N ' +
      'split between first irrigation (CRI) and booting. Avoid late N — it ' +
      'causes lodging and lowers protein quality.',
    common_pests: 'Yellow/stem rust, aphids, army worm, Karnal bunt',
    days_to_harvest: '110–130 days',
  },
  {
    crop_name: 'Maize (Corn)',
    local_name: 'Maize',
    season: 'Kharif (Jun–Sep); Rabi and Spring under irrigation',
    planting_method:
      'Direct seed in rows 60–75 cm apart, 20–25 cm between plants, 4–5 cm ' +
      'deep. Place 2 seeds per hole and thin to the strongest seedling after ' +
      '2 weeks. Prepare land by deep ploughing to 20–25 cm.',
    irrigation:
      'Needs 500–800 mm total. Most sensitive stages are knee-height, ' +
      'tasseling, and grain filling — never let the crop go thirsty in those ' +
      '3 weeks. Otherwise, every 7–10 days under irrigation.',
    fertilizer:
      'NPK 150:75:60 kg/ha. Full P and K plus 25% N at sowing; remainder N ' +
      'split between knee-height and tasseling. Zinc deficiency is common — ' +
      'apply 25 kg ZnSO₄/ha if needed.',
    common_pests: 'Fall armyworm, stem borer, maize streak virus, turcicum leaf blight',
    days_to_harvest: '90–120 days',
  },
  {
    crop_name: 'Sugarcane',
    local_name: 'Sugarcane',
    season: 'Perennial (12–18 months in field)',
    planting_method:
      'Plant 2–3 budded setts in furrows 90–120 cm apart, 5–7 cm deep, end ' +
      'to end with 50,000–60,000 setts/ha. Soak setts in 0.1% carbendazim ' +
      'for 15 min before planting to control sett-borne diseases.',
    irrigation:
      'Heavy water user — 1500–2500 mm over the crop cycle. Furrow irrigation ' +
      'every 7–10 days during formative phase, then 10–14 days during grand ' +
      'growth. Stop irrigation 2–3 weeks before harvest for better sugar recovery.',
    fertilizer:
      'NPK 200:80:80 kg/ha applied in 3 splits at planting, formative stage ' +
      '(45 DAP), and grand growth (90 DAP). Supplement with 25 kg FeSO₄ and ' +
      'ZnSO₄ each per hectare on deficient soils.',
    common_pests: 'Red rot, early shoot borer, scale insects, smut',
    days_to_harvest: '300–365 days (plant crop); ratoons at 12 months',
  },
  {
    crop_name: 'Tomato',
    local_name: 'Tomato',
    season: 'Year-round; best at start of dry season under irrigation',
    planting_method:
      'Start seedlings in a nursery for 3–4 weeks; transplant when 4–5 true ' +
      'leaves appear. Space plants 45–60 cm apart in rows 90–100 cm apart ' +
      'for airflow. Stake or trellis to keep fruit off the ground.',
    irrigation:
      'Drip irrigation preferred — keep soil moisture even. Every 4–7 days ' +
      'depending on soil type. Uneven watering causes blossom-end rot and ' +
      'fruit cracking. Reduce water slightly at fruit maturity to concentrate flavor.',
    fertilizer:
      'Apply compost and P-rich basal at transplanting. Side-dress with ' +
      'balanced NPK at flowering and first fruit set. Avoid excess N — it ' +
      'gives leafy plants with poor fruiting. Foliar Ca sprays prevent blossom-end rot.',
    common_pests: 'Whitefly, tuta absoluta (leaf miner), late blight, fruit borer',
    days_to_harvest: '70–100 days after transplanting',
  },
  {
    crop_name: 'Cotton',
    local_name: 'Cotton',
    season: 'Kharif (May–Nov)',
    planting_method:
      'Sow in rows 90–100 cm apart, 30–45 cm between plants, 3–4 cm deep. ' +
      'Bt hybrids reduce bollworm pressure dramatically but watch for ' +
      'resistance — always plant a 20% non-Bt refuge.',
    irrigation:
      'Mostly rainfed in Kharif zone; irrigated cotton needs 700–1300 mm ' +
      'total. Critical stages: squaring, flowering, boll development. ' +
      'Skip irrigation at peak flowering if rains are adequate.',
    fertilizer:
      'NPK 100:50:50 kg/ha. Apply 50% N + full P + full K at sowing; rest N ' +
      'split at squaring and peak flowering. Foliar K sprays during boll ' +
      'filling improve fiber quality.',
    common_pests: 'Bollworm complex, whitefly, pink bollworm, jassids',
    days_to_harvest: '160–200 days (first picking at ~120 days)',
  },
  {
    crop_name: 'Onion',
    local_name: 'Onion',
    season: 'Rabi and Kharif (transplant-based)',
    planting_method:
      'Raise seedlings in a nursery bed for 6–8 weeks; transplant at ' +
      '10–15 cm spacing in rows 20 cm apart once seedlings are pencil-thick. ' +
      'Raised beds improve drainage and bulb quality.',
    irrigation:
      'Shallow roots — frequent light irrigation every 3–5 days, especially ' +
      'during bulbing. Reduce and stop 2–3 weeks before harvest so the neck ' +
      'dries down for better storage.',
    fertilizer:
      'Incorporate compost before transplanting. Split-apply N and K — heavy ' +
      'early for leaf growth, taper off once bulbing starts (excess late N = ' +
      'soft bulbs, poor storage).',
    common_pests: 'Thrips, onion fly, purple blotch, Stemphylium blight',
    days_to_harvest: '90–150 days after transplanting',
  },
  {
    crop_name: 'Groundnut',
    local_name: 'Groundnut',
    season: 'Kharif (Jun–Sep); Rabi/Summer under irrigation',
    planting_method:
      'Sow treated kernels (with thiram or captan) at 30x10 cm spacing, ' +
      '5 cm deep. Apply rhizobium culture for first-time groundnut fields. ' +
      'Earthing-up at 30–35 DAS improves pod development.',
    irrigation:
      'Mostly rainfed in Kharif; critical irrigation at pegging and pod ' +
      'development stages. Avoid water stress during flowering — it causes ' +
      'poor pod set.',
    fertilizer:
      'NPK 25:50:25 kg/ha + 200 kg gypsum/ha at flowering for pod filling ' +
      'and kernel quality. Apply Ca through gypsum, not lime, on acid soils.',
    common_pests: 'Tikka leaf spot, rust, white grub, leaf miner',
    days_to_harvest: '100–130 days',
  },
];

function up(db) {
  if (!tableExists(db, 'crops')) {
    throw new Error('crops table missing — run migration 001 first.');
  }

  // ---- 1. Live `crops` table: keep existing API working --------------
  const insertCrop = db.prepare(`
    INSERT OR REPLACE INTO crops
      (crop_name, local_name, season, planting_method, irrigation, fertilizer, common_pests, days_to_harvest)
    VALUES
      (@crop_name, @local_name, @season, @planting_method, @irrigation, @fertilizer, @common_pests, @days_to_harvest)
  `);
  let cropsTouched = 0;
  for (const c of FIGMA_CROPS) {
    insertCrop.run(c);
    cropsTouched++;
  }

  // ---- 1b. Remove legacy Somali crops from the live crops table -------
  // These rows are preserved in db/agri_legacy_backup_<date>.db per the
  // data decision. They must NOT appear in the live app's crop lists.
  // Idempotent: deleting a name that's already gone is a no-op.
  const LEGACY_CROP_NAMES = ['Galley', 'Qamadi', 'Basal', 'Yaanyo'];
  const deleteLegacy = db.prepare('DELETE FROM crops WHERE crop_name = ?');
  let legacyRemoved = 0;
  for (const name of LEGACY_CROP_NAMES) {
    const info = deleteLegacy.run(name);
    legacyRemoved += info.changes;
  }

  // ---- 2. New `plants` table: rich catalog for PlantExplorer ---------
  if (tableExists(db, 'plants')) {
    const insertPlant = db.prepare(`
      INSERT OR REPLACE INTO plants
        (slug, name, scientific_name, category, season, water_need, climate, region,
         duration, expected_yield, difficulty, profitability, market_price,
         image_url, description, overview_json, agronomy_json, pests_json, resources_json)
      VALUES
        (@slug, @name, @scientific_name, @category, @season, @water_need, @climate, @region,
         @duration, @expected_yield, @difficulty, @profitability, @market_price,
         @image_url, @description, @overview_json, @agronomy_json, @pests_json, @resources_json)
    `);

    const PLANTS = [
      {
        slug: 'rice',
        name: 'Rice (Paddy)',
        scientific_name: 'Oryza sativa',
        category: 'Cereals',
        season: 'Kharif',
        water_need: 'High',
        climate: 'Tropical',
        region: 'Pan-India + Sub-Saharan Africa',
        duration: '120–150 days',
        expected_yield: '4.5 tons/acre',
        difficulty: 'Medium',
        profitability: 'High',
        market_price: '₹1,800–2,200/quintal',
        image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
        description: 'Staple cereal grown extensively in regions with abundant water; year-round under irrigation.',
        overview_json: JSON.stringify({
          family: 'Poaceae', lifecycle: 'Annual',
          planting_depth: '2–3 cm (transplanted seedling)',
          spacing: '20x15 cm', soil_type: 'Clay loam, puddled', ph_range: '6.0–7.0',
        }),
        agronomy_json: JSON.stringify({
          land_prep: 'Puddling in standing water; level field',
          seed_rate: '20–25 kg/acre',
          fertilizer: 'NPK 120:60:40 kg/acre',
          irrigation: 'Continuous flooding 2–5 cm during veg',
          intercropping: 'Fish farming, duck rearing',
        }),
        pests_json: JSON.stringify([
          { name: 'Brown plant hopper', severity: 'High', treatment: 'Imidacloprid spray' },
          { name: 'Stem borer', severity: 'Medium', treatment: 'Chlorpyrifos / pheromone traps' },
          { name: 'Blast disease', severity: 'High', treatment: 'Tricyclazole fungicide' },
        ]),
        resources_json: JSON.stringify([
          { title: 'Rice Cultivation Guide', type: 'video', duration: '15 min' },
          { title: 'Water Management in Rice', type: 'article', duration: '8 min read' },
        ]),
      },
      {
        slug: 'wheat',
        name: 'Wheat',
        scientific_name: 'Triticum aestivum',
        category: 'Cereals',
        season: 'Rabi',
        water_need: 'Medium',
        climate: 'Temperate',
        region: 'North + Central India',
        duration: '110–130 days',
        expected_yield: '3.2 tons/acre',
        difficulty: 'Easy',
        profitability: 'Medium',
        market_price: '₹2,000–2,400/quintal',
        image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop',
        description: 'Major winter cereal; cool dry season planting under irrigation.',
        overview_json: JSON.stringify({
          family: 'Poaceae', lifecycle: 'Annual',
          planting_depth: '3–5 cm', spacing: '20 cm rows',
          soil_type: 'Well-drained loamy', ph_range: '6.0–7.5',
        }),
        agronomy_json: JSON.stringify({
          land_prep: '2–3 ploughings with cultivator; level seedbed',
          seed_rate: '40–50 kg/acre',
          fertilizer: 'NPK 120:60:40 kg/acre',
          irrigation: '5–6 critical-stage irrigations',
          intercropping: 'Gram, mustard, lentil',
        }),
        pests_json: JSON.stringify([
          { name: 'Aphids', severity: 'Medium', treatment: 'Dimethoate spray' },
          { name: 'Rust (yellow/stem)', severity: 'High', treatment: 'Propiconazole fungicide' },
          { name: 'Termites', severity: 'Low', treatment: 'Chlorpyrifos soil treatment' },
        ]),
        resources_json: JSON.stringify([
          { title: 'Modern Wheat Farming', type: 'video', duration: '12 min' },
          { title: 'Disease Management in Wheat', type: 'article', duration: '6 min read' },
        ]),
      },
      {
        slug: 'maize',
        name: 'Maize (Corn)',
        scientific_name: 'Zea mays',
        category: 'Cereals',
        season: 'Kharif',
        water_need: 'Medium',
        climate: 'Tropical',
        region: 'Pan-India + East Africa',
        duration: '90–120 days',
        expected_yield: '3.0 tons/acre',
        difficulty: 'Easy',
        profitability: 'Medium',
        market_price: '₹1,500–1,900/quintal',
        image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop',
        description: 'Versatile cereal used for food, feed, and industry; year-round under irrigation.',
        overview_json: JSON.stringify({
          family: 'Poaceae', lifecycle: 'Annual',
          planting_depth: '4–5 cm', spacing: '60–75x20–25 cm',
          soil_type: 'Well-drained loam', ph_range: '5.5–7.5',
        }),
        agronomy_json: JSON.stringify({
          land_prep: 'Deep ploughing; break clods',
          seed_rate: '8–10 kg/acre',
          fertilizer: 'NPK 150:75:60 kg/acre',
          irrigation: 'Every 7–10 days; critical at tasseling',
          intercropping: 'Beans, cowpea',
        }),
        pests_json: JSON.stringify([
          { name: 'Fall armyworm', severity: 'High', treatment: 'Emamectin benzoate / pheromone traps' },
          { name: 'Stem borer', severity: 'Medium', treatment: 'Carbofuran application' },
          { name: 'Turcicum leaf blight', severity: 'Medium', treatment: 'Resistant varieties + Mancozeb' },
        ]),
        resources_json: JSON.stringify([
          { title: 'Maize Production Guide', type: 'video', duration: '14 min' },
          { title: 'Fall Armyworm IPM', type: 'article', duration: '9 min read' },
        ]),
      },
      {
        slug: 'sugarcane',
        name: 'Sugarcane',
        scientific_name: 'Saccharum officinarum',
        category: 'Cash Crops',
        season: 'Perennial',
        water_need: 'Very High',
        climate: 'Tropical',
        region: 'Maharashtra, UP, Karnataka',
        duration: '12–18 months',
        expected_yield: '45–60 tons/acre',
        difficulty: 'Medium',
        profitability: 'Very High',
        market_price: '₹280–320/quintal',
        image_url: 'https://images.unsplash.com/photo-1637335556827-bf5923d77f33?w=400&h=300&fit=crop',
        description: 'Long-duration cash crop with excellent market demand; ratoon management extends productivity.',
        overview_json: JSON.stringify({
          family: 'Poaceae', lifecycle: 'Perennial',
          planting_depth: '5–7 cm', spacing: '90–120 cm rows',
          soil_type: 'Deep, well-drained', ph_range: '6.5–7.5',
        }),
        agronomy_json: JSON.stringify({
          land_prep: 'Deep ploughing and furrow making',
          seed_rate: '50,000–60,000 setts/acre',
          fertilizer: 'NPK 200:80:80 kg/acre',
          irrigation: 'Heavy, especially at formative + grand growth',
          intercropping: 'Potato, onion, garlic (first 90 days)',
        }),
        pests_json: JSON.stringify([
          { name: 'Red rot', severity: 'High', treatment: 'Resistant varieties + sett treatment' },
          { name: 'Early shoot borer', severity: 'Medium', treatment: 'Carbofuran application' },
          { name: 'Scale insects', severity: 'Low', treatment: 'Malathion spray' },
        ]),
        resources_json: JSON.stringify([
          { title: 'Sustainable Sugarcane Production', type: 'video', duration: '20 min' },
          { title: 'Water Management in Sugarcane', type: 'article', duration: '12 min read' },
        ]),
      },
      {
        slug: 'tomato',
        name: 'Tomato',
        scientific_name: 'Solanum lycopersicum',
        category: 'Vegetables',
        season: 'All Season',
        water_need: 'Medium',
        climate: 'Temperate',
        region: 'Pan India',
        duration: '90–120 days',
        expected_yield: '15–20 tons/acre',
        difficulty: 'Hard',
        profitability: 'Very High',
        market_price: '₹800–1,500/quintal',
        image_url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=300&fit=crop',
        description: 'Year-round with proper care and protection; high-value with strong demand.',
        overview_json: JSON.stringify({
          family: 'Solanaceae', lifecycle: 'Annual',
          planting_depth: '1–2 cm (nursery)',
          spacing: '60x45 cm', soil_type: 'Well-drained sandy loam',
          ph_range: '6.0–6.8',
        }),
        agronomy_json: JSON.stringify({
          land_prep: 'Deep ploughing with organic matter',
          seed_rate: '200–250 g/acre',
          fertilizer: 'NPK 150:75:75 kg/acre',
          irrigation: 'Drip irrigation preferred',
          intercropping: 'Coriander, onion, garlic',
        }),
        pests_json: JSON.stringify([
          { name: 'Late blight', severity: 'High', treatment: 'Mancozeb spray' },
          { name: 'Whitefly', severity: 'High', treatment: 'Imidacloprid / yellow sticky traps' },
          { name: 'Fruit borer', severity: 'Medium', treatment: 'NPV spray + pheromone traps' },
        ]),
        resources_json: JSON.stringify([
          { title: 'Greenhouse Tomato Production', type: 'video', duration: '18 min' },
          { title: 'Integrated Pest Management', type: 'article', duration: '10 min read' },
        ]),
      },
      {
        slug: 'cotton',
        name: 'Cotton',
        scientific_name: 'Gossypium hirsutum',
        category: 'Cash Crops',
        season: 'Kharif',
        water_need: 'Medium',
        climate: 'Tropical',
        region: 'Gujarat, Maharashtra, Telangana',
        duration: '160–200 days',
        expected_yield: '2.8 quintals/acre',
        difficulty: 'Medium',
        profitability: 'High',
        market_price: '₹6,000–7,500/quintal',
        image_url: 'https://images.unsplash.com/photo-1502395809857-fd80069897d0?w=400&h=300&fit=crop',
        description: 'Commercial fiber crop with strong export demand; Bt hybrids reduce bollworm pressure.',
        overview_json: JSON.stringify({
          family: 'Malvaceae', lifecycle: 'Annual',
          planting_depth: '3–4 cm', spacing: '90–100x30–45 cm',
          soil_type: 'Black cotton soil', ph_range: '5.8–8.0',
        }),
        agronomy_json: JSON.stringify({
          land_prep: 'Deep ploughing; ridges and furrows',
          seed_rate: '1–1.5 kg/acre',
          fertilizer: 'NPK 100:50:50 kg/acre',
          irrigation: 'Critical at squaring, flowering, boll dev',
          intercropping: 'Green gram, black gram',
        }),
        pests_json: JSON.stringify([
          { name: 'Bollworm complex', severity: 'High', treatment: 'Bt hybrids + IPM' },
          { name: 'Whitefly', severity: 'High', treatment: 'Neem oil + yellow sticky traps' },
          { name: 'Pink bollworm', severity: 'Medium', treatment: 'Pheromone traps + clean-up' },
        ]),
        resources_json: JSON.stringify([
          { title: 'Bt Cotton Management', type: 'video', duration: '16 min' },
          { title: 'Pink Bollworm IPM', type: 'article', duration: '11 min read' },
        ]),
      },
      {
        slug: 'onion',
        name: 'Onion',
        scientific_name: 'Allium cepa',
        category: 'Vegetables',
        season: 'Rabi + Kharif',
        water_need: 'Medium',
        climate: 'Temperate',
        region: 'Maharashtra, Karnataka, MP',
        duration: '90–150 days after transplanting',
        expected_yield: '10–15 tons/acre',
        difficulty: 'Medium',
        profitability: 'High',
        market_price: '₹1,200–2,500/quintal',
        image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=300&fit=crop',
        description: 'High-value bulb crop with strong domestic demand and export potential.',
        overview_json: JSON.stringify({
          family: 'Amaryllidaceae', lifecycle: 'Biennial',
          planting_depth: '2–3 cm (transplant)',
          spacing: '15x10 cm', soil_type: 'Well-drained loam',
          ph_range: '6.0–7.5',
        }),
        agronomy_json: JSON.stringify({
          land_prep: 'Raised beds; incorporate compost',
          seed_rate: '3–4 kg/acre (for nursery)',
          fertilizer: 'NPK 100:50:75 kg/acre',
          irrigation: 'Light, frequent — every 3–5 days',
          intercropping: 'Coriander, sugarcane (first 90 days)',
        }),
        pests_json: JSON.stringify([
          { name: 'Thrips', severity: 'High', treatment: 'Fipronil / neem oil spray' },
          { name: 'Purple blotch', severity: 'Medium', treatment: 'Mancozeb + Iprodione' },
          { name: 'Stemphylium blight', severity: 'Medium', treatment: 'Tebuconazole spray' },
        ]),
        resources_json: JSON.stringify([
          { title: 'Onion Production Guide', type: 'video', duration: '13 min' },
          { title: 'Storage and Curing', type: 'article', duration: '7 min read' },
        ]),
      },
      {
        slug: 'groundnut',
        name: 'Groundnut',
        scientific_name: 'Arachis hypogaea',
        category: 'Oil Seeds',
        season: 'Kharif',
        water_need: 'Medium',
        climate: 'Tropical',
        region: 'Gujarat, AP, Karnataka',
        duration: '100–130 days',
        expected_yield: '1.2–1.5 tons/acre',
        difficulty: 'Easy',
        profitability: 'Medium',
        market_price: '₹5,000–6,000/quintal',
        image_url: 'https://images.unsplash.com/photo-1549978113-29eb25c8177f?w=400&h=300&fit=crop',
        description: 'Major oilseed and confectionery crop; nitrogen-fixing legume improves soil.',
        overview_json: JSON.stringify({
          family: 'Fabaceae', lifecycle: 'Annual',
          planting_depth: '5 cm', spacing: '30x10 cm',
          soil_type: 'Sandy loam', ph_range: '6.0–7.5',
        }),
        agronomy_json: JSON.stringify({
          land_prep: 'Deep ploughing; raised bed / ridge planting',
          seed_rate: '40–50 kg/acre (kernels)',
          fertilizer: 'NPK 25:50:25 + 200 kg gypsum/ha',
          irrigation: 'Critical at pegging and pod dev',
          intercropping: 'Sunflower, castor, pigeon pea',
        }),
        pests_json: JSON.stringify([
          { name: 'Tikka leaf spot', severity: 'High', treatment: 'Mancozeb / Chlorothalonil' },
          { name: 'Rust', severity: 'Medium', treatment: 'Hexaconazole spray' },
          { name: 'White grub', severity: 'Medium', treatment: 'Soil application of chlorpyrifos' },
        ]),
        resources_json: JSON.stringify([
          { title: 'Groundnut Production', type: 'video', duration: '11 min' },
          { title: 'Gypsum and Pod Development', type: 'article', duration: '8 min read' },
        ]),
      },
    ];

    let plantsTouched = 0;
    for (const p of PLANTS) {
      insertPlant.run(p);
      plantsTouched++;
    }

    return { cropsTouched, legacyRemoved, plantsTouched };
  }

  return { cropsTouched, legacyRemoved, plantsTouched: 0 };
}

module.exports = { up };