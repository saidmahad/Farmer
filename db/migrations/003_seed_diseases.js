// db/migrations/003_seed_diseases.js
// Seeds the diseases catalog used by DiseaseLibrary. Forward-only,
// idempotent — re-running is a no-op.

function tableExists(db, name) {
  return Boolean(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
      .get(name)
  );
}

const DISEASES = [
  {
    slug: 'rice-blast',
    name: 'Rice Blast',
    crop_slug: 'rice',
    category: 'Fungal',
    severity: 'High',
    symptoms:
      'Diamond-shaped grey-green water-soaked lesions on leaves that widen into spindle-shaped spots with grey centres and brown margins. Severely infected leaves dry up; neck rot causes panicles to break at the node.',
    treatment:
      'Spray Tricyclazole 75% WP at 0.6 g/L or Isoprothiolane at 1.5 ml/L at boot stage. Repeat after 10–12 days if humid conditions persist. Drain the field to reduce humidity around the canopy.',
    prevention:
      'Use resistant varieties (IR 64, Improved Samba Mahsuri). Avoid excess nitrogen. Maintain proper plant spacing for airflow.',
    image_url: 'https://images.unsplash.com/photo-1530507629858-e3759c1e0d1b?w=400&h=300&fit=crop',
  },
  {
    slug: 'wheat-yellow-rust',
    name: 'Yellow Rust (Stripe Rust)',
    crop_slug: 'wheat',
    category: 'Fungal',
    severity: 'High',
    symptoms:
      'Bright yellow-orange powdery stripes of uredinial pustules arranged linearly along leaf veins. Severe infections turn leaves brown and dry. Spreads quickly in cool (10–20°C) humid weather.',
    treatment:
      'Propiconazole 25 EC at 1 ml/L or Tebuconazole 250 EC at 1 ml/L at first sign of stripe formation. Repeat after 15 days. Curative fungicide use only under extension officer guidance.',
    prevention:
      'Sow resistant varieties (HD 3086, DBW 187). Early sowing in November avoids peak infection window. Avoid late nitrogen top-dressing.',
    image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop',
  },
  {
    slug: 'tomato-late-blight',
    name: 'Tomato Late Blight',
    crop_slug: 'tomato',
    category: 'Oomycete',
    severity: 'High',
    symptoms:
      'Water-soaked greasy lesions on leaves and stems that turn brown within 1–2 days. White fungal growth on leaf undersides in humid conditions. Fruit develops firm brown greasy spots that rot.',
    treatment:
      'Mancozeb 75% WP at 2.5 g/L as a protectant every 7–10 days. Switch to Cymoxanil + Mancozeb or Dimethomorph under heavy pressure. Remove and burn infected plants immediately.',
    prevention:
      'Use certified disease-free seed and resistant hybrids. Stake and prune for airflow. Avoid overhead irrigation. Rotate away from potato for 2+ seasons.',
    image_url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=300&fit=crop',
  },
  {
    slug: 'cotton-pink-bollworm',
    name: 'Pink Bollworm',
    crop_slug: 'cotton',
    category: 'Pest',
    severity: 'High',
    symptoms:
      'Rosy-pink larvae bore into bolls, feeding on developing seeds. Stained lint with frass at the boll entry hole. Premature boll opening. Larvae enter bracts and flowers too.',
    treatment:
      'Pheromone traps (5/acre) for monitoring and mass trapping. Spray Emamectin Benzoate 5% SG at 0.4 g/L at peak flowering. Avoid late-season cotton — terminate crop by January.',
    prevention:
      'Install pheromone traps early. Follow the mandatory refuge strategy with Bt cotton (20% non-Bt). Conduct clean-up ploughing immediately after harvest to destroy pupae in soil.',
    image_url: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop',
  },
  {
    slug: 'maize-fall-armyworm',
    name: 'Fall Armyworm',
    crop_slug: 'maize',
    category: 'Pest',
    severity: 'High',
    symptoms:
      'Ragged feeding damage and large amounts of frass in the whorl. Windowpane feeding on younger leaves. Larvae up to 4 cm with a characteristic inverted-Y on the head capsule.',
    treatment:
      'Emamectin Benzoate 5% SG at 0.4 g/L directed into the whorl. Or apply Spinetoram 11.7% SC at 0.5 ml/L. Treat during early morning or evening when larvae are active.',
    prevention:
      'Scout whorls weekly from emergence through tasseling. Pheromone traps for early warning. Intercrop with legumes to disrupt moth host-finding. Destroy crop residues after harvest.',
    image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop',
  },
  {
    slug: 'groundnut-tikka-leaf-spot',
    name: 'Tikka Leaf Spot',
    crop_slug: 'groundnut',
    category: 'Fungal',
    severity: 'Medium',
    symptoms:
      'Circular dark brown spots with a yellow halo on leaves. Spots coalesce under humid conditions causing extensive defoliation. Lesions may also form on stems and pegs.',
    treatment:
      'Mancozeb 75% WP at 2.5 g/L at first appearance; 2–3 sprays at 10–14 day intervals. Chlorothalonil is an alternative under wet weather. Begin at 30–35 DAS.',
    prevention:
      'Sow treated kernels with Captan or Thiram. Use resistant varieties (GG 20, TG 37A). Follow 2-year rotation with cereals. Remove volunteer plants.',
    image_url: 'https://images.unsplash.com/photo-1567892320421-2c45ca7c2238?w=400&h=300&fit=crop',
  },
  {
    slug: 'onion-purple-blotch',
    name: 'Purple Blotch',
    crop_slug: 'onion',
    category: 'Fungal',
    severity: 'Medium',
    symptoms:
      'Water-soaked lesions on leaves that develop into purple-brown elongated spots with concentric rings. Severe cases cause tip dieback and bulb rot in storage.',
    treatment:
      'Mancozeb 75% WP at 2.5 g/L + Iprodione at 1 ml/L alternated every 10–14 days. Tebuconazole 250 EC at 1 ml/L is a strong curative option.',
    prevention:
      'Use disease-free sets. Practice 3-year crop rotation. Wider spacing (15–20 cm) improves airflow. Avoid overhead irrigation late in the day.',
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop',
  },
  {
    slug: 'sugarcane-red-rot',
    name: 'Sugarcane Red Rot',
    crop_slug: 'sugarcane',
    category: 'Fungal',
    severity: 'High',
    symptoms:
      'Red discoloration of internode tissue with alcoholic-sour smell. Pith dries and shrinks; stalk cross-section shows red bands alternating with white. Top leaves dry out.',
    treatment:
      'No effective curative treatment once infected. Rogue and burn infected clumps. Treat healthy setts in 0.1% Carbendazim solution for 15 minutes before planting.',
    prevention:
      'Plant only disease-free seed cane from a certified source. Use resistant varieties (Co 0238, Co 0118). Avoid waterlogging. Long rotation away from sugarcane.',
    image_url: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400&h=300&fit=crop',
  },
  {
    slug: 'cotton-whitefly',
    name: 'Cotton Whitefly',
    crop_slug: 'cotton',
    category: 'Pest',
    severity: 'High',
    symptoms:
      'Sticky honeydew on leaves with associated sooty mould (black coating). Yellowing and wilting. Heavy infestations cause leaf shedding and boll drop. Tiny white winged insects on leaf undersides.',
    treatment:
      'Yellow sticky traps (10/acre) for monitoring. Spray Neem oil 0.5% or Diafenthiuron 50% WP at 1.2 g/L. Rotate chemical groups to avoid resistance.',
    prevention:
      'Avoid late-season cotton. Destroy crop residue immediately after harvest. Border-trap cropping with sunflower or marigold.',
    image_url: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop',
  },
  {
    slug: 'tomato-leaf-curl-virus',
    name: 'Tomato Leaf Curl Virus',
    crop_slug: 'tomato',
    category: 'Viral',
    severity: 'High',
    symptoms:
      'Severe upward curling and crinkling of young leaves. Stunted growth. Flowers drop, leading to no or very small fruit. Yellow vein clearing on leaf undersides.',
    treatment:
      'No cure once infected. Rogue infected plants. Control the whitefly vector with Imidacloprid 17.8% SL at 0.5 ml/L or yellow sticky traps.',
    prevention:
      'Plant only TYLCV-resistant hybrids. Use reflective silver mulch to repel whiteflies. Install 50-mesh insect-proof netting in nurseries.',
    image_url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=300&fit=crop',
  },
  {
    slug: 'rice-bph',
    name: 'Brown Plant Hopper',
    crop_slug: 'rice',
    category: 'Pest',
    severity: 'High',
    symptoms:
      'Hopperburn — circular patches of yellow then brown drying plants. Heavy infestations cause complete field collapse. Honeydew and sooty mould on lower leaves.',
    treatment:
      'Imidacloprid 17.8% SL at 0.5 ml/L or Clothianidin 50% WDG at 0.5 g/L. Drain the field for 2–3 days to disrupt the pest. Avoid pyrethroids — they flare BPH.',
    prevention:
      'Use resistant varieties. Maintain proper plant spacing (20x15 cm). Avoid excess nitrogen which attracts BPH. Alternate wet/dry irrigation rather than continuous flooding.',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
  },
  {
    slug: 'maize-nutrient-deficiency',
    name: 'Nitrogen Deficiency',
    crop_slug: 'maize',
    category: 'Deficiency',
    severity: 'Low',
    symptoms:
      'V-shaped yellowing starting from the leaf tip and progressing down the midrib of older (lower) leaves first. Stunted growth and small cobs.',
    treatment:
      'Apply urea at 50 kg N/ha as top-dressing at knee-height stage. Foliar spray of 2% urea gives a quick green-up within 5–7 days for emergency correction.',
    prevention:
      'Apply the recommended 150 kg N/ha in split doses (basal + knee-height + tasseling). Incorporate crop residues from the previous season to build organic nitrogen.',
    image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop',
  },
];

function up(db) {
  if (!tableExists(db, 'diseases')) {
    return { diseasesSeeded: 0, tableExists: false };
  }

  const insert = db.prepare(`
    INSERT OR REPLACE INTO diseases
      (slug, name, crop_slug, category, severity, symptoms, treatment, prevention, image_url)
    VALUES
      (@slug, @name, @crop_slug, @category, @severity, @symptoms, @treatment, @prevention, @image_url)
  `);
  let count = 0;
  for (const d of DISEASES) {
    insert.run(d);
    count++;
  }
  return { diseasesSeeded: count, tableExists: true };
}

module.exports = { up };