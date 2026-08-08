// middleware/upload.js
// Per-route multer instances with scoped body-size limits.
//
// The global express.json() parser in server.js is capped at 10kb to
// keep the surface tight; image uploads need much more. Instead of
// raising the global limit, we expose purpose-built parsers and attach
// them only to the routes that need them.
//
// Usage:
//   const { uploadSoil, uploadFeedback } = require('../middleware/upload');
//   router.post('/predict', uploadSoil.single('image'), handler);

const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

// Ensure the destination dirs exist at import time so a misconfigured
// server fails loudly on boot rather than at first upload.
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}
ensureDir(path.join(UPLOAD_ROOT, 'soil'));
ensureDir(path.join(UPLOAD_ROOT, 'feedback'));

// Use the disk storage engine so we get a stable path for retrieval.
// Original filenames from the client are never trusted.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Soil predictions vs feedback have separate folders so we can
    // size-limit + clean up independently.
    const bucket = file.fieldname === 'screenshot' ? 'feedback' : 'soil';
    cb(null, path.join(UPLOAD_ROOT, bucket));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 8);
    const stamp = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    cb(null, `${stamp}-${rand}${ext || '.bin'}`);
  },
});

const imageOnly = (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image uploads are accepted.'));
  }
  cb(null, true);
};

// SoilPrediction uploads: 10 MB cap. Photos come from phone cameras that
// can easily hit 6–8 MB on default settings.
const uploadSoil = multer({
  storage,
  fileFilter: imageOnly,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

// Feedback screenshot uploads: 5 MB cap. Anything bigger is almost
// certainly a wrong-file mistake rather than a real screenshot.
const uploadFeedback = multer({
  storage,
  fileFilter: imageOnly,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

module.exports = { uploadSoil, uploadFeedback, UPLOAD_ROOT };