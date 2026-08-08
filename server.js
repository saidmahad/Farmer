// server.js
// Agricultural Advisory System - entry point.

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

if (!process.env.JWT_SECRET) {
  console.error(
    '\nMissing JWT_SECRET. Copy .env.example to .env and set a JWT_SECRET before starting the server.\n'
  );
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const cropRoutes = require('./routes/crops');
const adviceRoutes = require('./routes/advice');
const soilRoutes = require('./routes/soil');
const plantRoutes = require('./routes/plants');
const diseaseRoutes = require('./routes/diseases');
const videoRoutes = require('./routes/videos');
const feedbackRoutes = require('./routes/feedback');
const chatRoutes = require('./routes/chat');
const reportRoutes = require('./routes/reports');
const subscriptionRoutes = require('./routes/subscriptions');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Security & parsing middleware -----------------------------------
app.use(
  helmet({
    // Relaxed CSP for the React app served from web/dist.
    // fonts.googleapis.com / fonts.gstatic.com are allowlisted so the
    // FarmerAI "Inter" typeface (per the Figma design) can be loaded;
    // images.unsplash.com is allowlisted so DiseaseLibrary / PlantExplorer
    // / CropRecommendation can show their catalog hero imagery;
    // img.youtube.com is allowlisted so VideoHub thumbnails render;
    // data: lets inline previews (e.g. uploaded thumbnails) render;
    // everything else stays first-party only.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        // upload.wikimedia.org hosts the verified Commons crop photos used by
        // PlantExplorer (every image's filename describes its crop, so a URL
        // is auditable against the crop name — unlike opaque Unsplash IDs).
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://img.youtube.com', 'https://upload.wikimedia.org']
      }
    }
  })
);
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// In production, terminate TLS at a reverse proxy (nginx/ALB) or a
// platform-managed cert (see README "Deployment"), and redirect any
// stray HTTP traffic to HTTPS here.
if (process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// --- API routes ---------------------------------------------------
app.use('/api', authRoutes);          // POST /api/register, POST /api/login
app.use('/api/crops', cropRoutes);    // GET /api/crops, GET /api/crops/:id
app.use('/api/advice', adviceRoutes); // GET /api/advice?crop_id=:id
app.use('/api', soilRoutes);          // POST /api/soil-predictions, GET /api/soil-predictions
app.use('/api/plants', plantRoutes);  // GET /api/plants, GET /api/plants/:slug
app.use('/api/diseases', diseaseRoutes); // GET /api/diseases, GET /api/diseases/:slug
app.use('/api/videos', videoRoutes);  // GET /api/videos, GET /api/videos/:slug
app.use('/api/feedback', feedbackRoutes); // POST /api/feedback, GET /api/feedback
app.use('/api/chat', chatRoutes);     // POST /api/chat, GET /api/chat
app.use('/api/reports', reportRoutes); // GET /api/reports, GET /api/reports/export
app.use('/api/subscriptions', subscriptionRoutes); // GET/POST/DELETE /api/subscriptions

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- Static frontend -------------------------------------------------
// The React app (web/) is the served frontend. Its production build lands
// in web/dist and replaces the old static HTML from /public, which is no
// longer visible to users.
const distDir = path.join(__dirname, 'web', 'dist');
app.use(express.static(distDir));

// SPA fallback: client-side routing (react-router) owns every non-/api
// GET, so deep links like /dashboard resolve to index.html instead of 404.
app.get(/^\/(?!api\/|health).*/, (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) res.status(404).json({ error: 'Frontend not built yet. Run `cd web && npm run build`.' });
  });
});

// --- 404 + error handling --------------------------------------------
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Agricultural Advisory System running at http://localhost:${PORT}`);
});
