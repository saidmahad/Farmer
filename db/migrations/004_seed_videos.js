// db/migrations/004_seed_videos.js
// Seeds the tutorial video catalog used by VideoHub. Forward-only,
// idempotent — re-running is a no-op.
//
// NOTE: ALL youtube_id values are PLACEHOLDERS (mock data). None of them are
// real instructional videos — swap in genuine YouTube IDs before launch.

function tableExists(db, name) {
  return Boolean(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
      .get(name)
  );
}

const VIDEOS = [
  {
    slug: 'rice-planting-techniques',
    title: 'Rice Planting Techniques for Maximum Yield',
    topic: 'planting',
    crop_slug: 'rice',
    duration: '15:20',
    youtube_id: 'dQw4w9WgXcQ', // placeholder
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    description:
      'A step-by-step guide to modern rice establishment: nursery management, seedling age, puddling, transplanting at correct spacing and depth, and water management through the vegetative stage.',
  },
  {
    slug: 'wheat-cultivation-guide',
    title: 'Complete Wheat Cultivation Guide',
    topic: 'cultivation',
    crop_slug: 'wheat',
    duration: '18:05',
    youtube_id: 'mock0000002', // placeholder
    thumbnail_url: 'https://img.youtube.com/vi/mock0000002/mqdefault.jpg',
    description:
      'From seedbed preparation to harvest: sowing time and seed rate, row spacing, critical-stage irrigation, split nitrogen application, and common rust and aphid management for healthy wheat.',
  },
  {
    slug: 'maize-pest-management',
    title: 'Maize Pest Management: Fall Armyworm & Stem Borer',
    topic: 'pest',
    crop_slug: 'maize',
    duration: '12:40',
    youtube_id: 'mock0000003', // placeholder
    thumbnail_url: 'https://img.youtube.com/vi/mock0000003/mqdefault.jpg',
    description:
      'Identify fall armyworm and stem borer damage in maize and learn integrated control: scouting whorls, pheromone traps, targeted insecticides, and cultural practices that reduce pest pressure.',
  },
  {
    slug: 'cotton-farming-basics',
    title: 'Cotton Farming Basics: From Seed to Bale',
    topic: 'farming',
    crop_slug: 'cotton',
    duration: '20:30',
    youtube_id: 'mock0000004', // placeholder
    thumbnail_url: 'https://img.youtube.com/vi/mock0000004/mqdefault.jpg',
    description:
      'The essentials of cotton production: soil and climate requirements, planting geometry, Bt hybrid selection with non-Bt refuge, irrigation at critical stages, and bollworm complex management.',
  },
  {
    slug: 'tomato-growing-tips',
    title: 'Tomato Growing Tips: Nursery to Harvest',
    topic: 'growing',
    crop_slug: 'tomato',
    duration: '16:45',
    youtube_id: 'mock0000005', // placeholder
    thumbnail_url: 'https://img.youtube.com/vi/mock0000005/mqdefault.jpg',
    description:
      'Practical tips for high-yield tomatoes: raising healthy seedlings, transplanting and staking, drip irrigation for even moisture, balanced fertilization, and preventing blossom-end rot and late blight.',
  },
  {
    slug: 'onion-cultivation',
    title: 'Onion Cultivation: Nursery and Bulb Management',
    topic: 'cultivation',
    crop_slug: 'onion',
    duration: '14:10',
    youtube_id: 'mock0000006', // placeholder
    thumbnail_url: 'https://img.youtube.com/vi/mock0000006/mqdefault.jpg',
    description:
      'Grow quality onions from nursery to storage: seedbed preparation, transplanting at the right size, light frequent irrigation, split nitrogen and potassium, and curing bulbs for long storage life.',
  },
  {
    slug: 'groundnut-farming',
    title: 'Groundnut Farming: Agronomy for Better Pod Set',
    topic: 'farming',
    crop_slug: 'groundnut',
    duration: '13:25',
    youtube_id: 'mock0000007', // placeholder
    thumbnail_url: 'https://img.youtube.com/vi/mock0000007/mqdefault.jpg',
    description:
      'Improve groundnut yields with correct seed treatment, rhizobium inoculation, spacing and earthing-up, irrigation at pegging and pod development, and gypsum application for pod filling.',
  },
  {
    slug: 'sugarcane-production',
    title: 'Sugarcane Production: Setts to Ratoon',
    topic: 'farming',
    crop_slug: 'sugarcane',
    duration: '22:15',
    youtube_id: 'mock0000008', // placeholder
    thumbnail_url: 'https://img.youtube.com/vi/mock0000008/mqdefault.jpg',
    description:
      'A complete sugarcane production guide: sett selection and treatment, furrow planting, heavy irrigation scheduling, three-split nutrition, ratoon management, and controlling red rot and shoot borer.',
  },
  {
    slug: 'soil-health-fundamentals',
    title: 'Soil Health Fundamentals: Test, Feed, Protect',
    topic: 'soil',
    crop_slug: null,
    duration: '17:55',
    youtube_id: 'mock0000009', // placeholder
    thumbnail_url: 'https://img.youtube.com/vi/mock0000009/mqdefault.jpg',
    description:
      'Understand the basics of soil health: how to take a soil sample, read pH and NPK results, correct acidity and alkalinity, build organic matter, and choose the right fertilizer for your field.',
  },
  {
    slug: 'organic-farming-methods',
    title: 'Organic Farming Methods: Compost to Crop Rotation',
    topic: 'organic',
    crop_slug: null,
    duration: '19:35',
    youtube_id: 'mock0000010', // placeholder
    thumbnail_url: 'https://img.youtube.com/vi/mock0000010/mqdefault.jpg',
    description:
      'A practical introduction to organic farming: making and applying compost, green manuring, biological pest control, crop rotation and intercropping, and getting certified for premium markets.',
  },
];

function up(db) {
  if (!tableExists(db, 'videos')) {
    return { videosSeeded: 0, tableExists: false };
  }

  const insert = db.prepare(`
    INSERT OR REPLACE INTO videos
      (slug, title, topic, crop_slug, duration, youtube_id, thumbnail_url, description)
    VALUES
      (@slug, @title, @topic, @crop_slug, @duration, @youtube_id, @thumbnail_url, @description)
  `);
  let count = 0;
  for (const v of VIDEOS) {
    insert.run(v);
    count++;
  }
  return { videosSeeded: count, tableExists: true };
}

module.exports = { up };
