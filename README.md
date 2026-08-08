# Beeraha — Agricultural Advisory System

A web app that lets a farmer create an account, pick a crop (Galley/maize,
Qamadi/wheat, Basal/onion, or Yaanyo/tomato), and get planting, irrigation,
and fertilizer advice for it.

Stack: **Node.js + Express** API, **SQLite** (via `better-sqlite3`, zero
config, single file, no separate DB server to run), plain **HTML/CSS/JS**
frontend (no build step).

---

## 1. Quick start

```bash
npm install
cp .env.example .env
# open .env and set JWT_SECRET to a long random string, e.g.:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

npm start
# → Agricultural Advisory System running at http://localhost:3000
```

Open `http://localhost:3000` — you'll land on the sign-in page. Click
**Sign up**, create an account, pick a crop, and you'll see its advisory.

The crop table is seeded automatically the first time the server starts
(`db/agri.db` is created on first run — safe to delete to reset all data).

---

## 2. Project structure

```
agri-advisor/
├── server.js                 # Express app entry point, middleware, routing
├── db/
│   └── index.js               # SQLite connection, schema, crop seed data
├── middleware/
│   └── auth.js                # JWT verification for protected routes
├── routes/
│   ├── auth.js                 # POST /api/register, POST /api/login
│   ├── crops.js                 # GET /api/crops, GET /api/crops/:id
│   └── advice.js                # GET /api/advice?crop_id=
├── utils/
│   ├── validate.js              # Registration/login input validation
│   └── adviceGenerator.js       # Template + optional AI advice generation
├── public/                    # Static frontend (no build step)
│   ├── index.html               # Sign in
│   ├── register.html            # Sign up
│   ├── crops.html               # Crop selection (post-login)
│   ├── advice.html              # Advice display
│   ├── css/style.css
│   └── js/{api.js, nav.js}
└── tests/
    ├── api.test.js              # Backend unit/integration tests (Node test runner)
    └── e2e/user-flow.spec.js    # Playwright end-to-end test (see §6)
```

---

## 3. Database schema

**users**

| column        | type    | notes                        |
|---------------|---------|-------------------------------|
| id            | INTEGER | primary key, autoincrement    |
| name          | TEXT    | required                      |
| email         | TEXT    | required, unique              |
| password_hash | TEXT    | bcrypt hash — plaintext is never stored |
| created_at    | TEXT    | defaults to now               |

**crops**

| column           | type    | notes                          |
|------------------|---------|----------------------------------|
| id               | INTEGER | primary key, autoincrement       |
| crop_name        | TEXT    | e.g. "Galley", unique            |
| local_name       | TEXT    | e.g. "Maize / Corn"              |
| season           | TEXT    | planting season guidance         |
| planting_method  | TEXT    | required                         |
| irrigation       | TEXT    | required                         |
| fertilizer       | TEXT    | required                         |
| common_pests     | TEXT    | optional                         |
| days_to_harvest  | TEXT    | optional                         |

---

## 4. API reference

All endpoints except `/api/register` and `/api/login` require
`Authorization: Bearer <token>`.

| Method | Path                       | Body / Query           | Description                              |
|--------|-----------------------------|--------------------------|--------------------------------------------|
| POST   | `/api/register`             | `{ name, email, password }` | Create a user, returns `{ token, user }` |
| POST   | `/api/login`                | `{ email, password }`   | Verify credentials, returns `{ token, user }` |
| GET    | `/api/crops`                | —                        | List available crops                     |
| GET    | `/api/crops/:id`            | —                        | Full agronomic detail for one crop       |
| GET    | `/api/advice?crop_id=:id`   | —                        | Natural-language advisory + structured fields |
| GET    | `/api/health`               | —                        | Liveness check (no auth)                 |

Example:

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Amina","email":"amina@example.com","password":"secure1234"}'

curl "http://localhost:3000/api/advice?crop_id=1" \
  -H "Authorization: Bearer <token from above>"
```

### Advice generation

`utils/adviceGenerator.js` combines the crop's `planting_method`,
`irrigation`, and `fertilizer` fields into a readable narrative. If
`ANTHROPIC_API_KEY` is set in `.env`, the same structured facts are sent
to the Claude API to produce a more conversational version; if the key
is absent or the call fails for any reason, it automatically falls back
to the template — the endpoint never breaks either way. The response's
`source` field tells you which path was used (`"ai"` or `"template"`).

---

## 5. Security notes

- Passwords are hashed with **bcrypt** (12 salt rounds) — plaintext is
  never written to the database.
- Auth uses short-lived **JWTs** (`JWT_EXPIRES_IN`, default 2h) signed
  with `JWT_SECRET`. Rotate this secret to invalidate all sessions.
- `/api/register` and `/api/login` are rate-limited (20 requests / 15
  min per IP) to slow down credential stuffing.
- `helmet` sets standard security headers, including a CSP.
- Generic "Invalid email or password" errors on login avoid leaking
  which emails are registered.
- **TLS**: this app does not terminate TLS itself. In production, put it
  behind a reverse proxy or a platform load balancer with a managed
  certificate (see §7) and set `FORCE_HTTPS=true` to redirect stray HTTP
  requests.
- Consider adding multi-factor authentication (e.g. TOTP or an SMS/email
  one-time code at login) before handling real farmer data at scale —
  not implemented here to keep the base system minimal, but the `users`
  table and login route are the natural place to add it.

---

## 6. Testing

### Backend unit/integration tests

Uses Node's built-in test runner — no extra dependency:

```bash
npm test
```

Covers: registration validation, duplicate-email rejection, password
hashing round-trip via login, wrong-password rejection, auth-gating on
`/api/crops` and `/api/advice`, and the crop-list/advice response shape.

### End-to-end tests

`tests/e2e/user-flow.spec.js` is a **Playwright** spec covering the full
UI journey: register → land on crop selection → pick a crop → see
planting/irrigation/fertilizer advice → log out. It also checks that an
unknown login shows a visible error and that `/crops.html` redirects to
sign-in without a session.

Playwright isn't installed by default (keeps `npm install` fast for the
core app). To run it:

```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
npm start &                      # server must be running
npx playwright test tests/e2e
```

`playwright.config.js` isn't included — Playwright will use sensible
defaults, or add one to target specific browsers/devices. For device and
browser coverage, run the same spec across Playwright's built-in device
profiles (e.g. `Pixel 5`, `iPhone 13`, `Desktop Chrome`, `Desktop
Firefox`, `Desktop Safari`) via `projects` in that config — the app is
plain responsive HTML/CSS, so no device-specific code paths exist to
diverge between them.

### Manual QA checklist

- [ ] Register with an already-used email → clear inline error, no crash
- [ ] Password under 8 characters → rejected client- and server-side
- [ ] Sign in with wrong password → generic error, no account enumeration
- [ ] Refresh `crops.html` directly without logging in → redirected to sign-in
- [ ] Token expiry (`JWT_EXPIRES_IN`) → next authenticated request redirects to sign-in
- [ ] Resize to mobile width (375px) → nav, forms, and crop grid remain usable
- [ ] Keyboard-only navigation reaches and activates every crop card and button

---

## 7. Deployment

This app is a single Express process that serves both the `/api` routes
and the built React app (`web/dist`), so deploying it is: build the
frontend, set `JWT_SECRET`, run the (idempotent) migrations, start the
server. The repo ships the deploy config (`render.yaml`, `Dockerfile`,
`railway.json`, `.env.example`) to make this one-click.

> **Free-demo caveat:** the free tiers of Render/Railway have an
> ephemeral filesystem — the SQLite database (`db/agri.db`) resets on
> every redeploy or restart. That's fine for showing the app off. When
> you want real users, either add a persistent disk and point `DB_PATH`
> at it, or switch to managed Postgres.

### Option A — Render (recommended, free)

1. Push this repo to GitHub (it is already set up for it).
2. Go to [render.com](https://render.com) → **Sign up** (GitHub login).
3. **New + → Blueprint** → connect GitHub → pick this repo.
4. Render reads `render.yaml` automatically: build = install deps + build
   the React app; start = run migrations + boot the server. It also
   generates a `JWT_SECRET` for you (rotate it later to log everyone out).
5. Click **Apply** and wait ~3–5 minutes. You get a free
   `https://agri-advisor.onrender.com` URL with HTTPS.

Environment variables set by the blueprint: `NODE_ENV=production`,
`FORCE_HTTPS=true`, `JWT_SECRET=<generated>`. Optional:
`ANTHROPIC_API_KEY` to enable AI-generated advice.

### Option B — Railway (free trial credits)

1. Push this repo to GitHub.
2. [railway.app](https://railway.app) → **New Project → Deploy from
   GitHub repo**.
3. Railway picks up `railway.json` + `Dockerfile` (builds the frontend,
   runs migrations on boot).
4. Add `JWT_SECRET` under **Variables**. Set `NODE_ENV=production`.

### Option C — any Node/container host (Fly.io, Heroku, VPS, EC2…)

```bash
npm ci
cd web && npm ci && npm run build && cd ..
npm start   # runs migrations, then boots the server
```

Environment variables to set in the platform's config (never commit a
real `.env`): `JWT_SECRET` (required), `NODE_ENV=production`,
`FORCE_HTTPS=true`, optionally `DB_PATH` (persistent volume) and
`ANTHROPIC_API_KEY`.

Point the platform's managed TLS certificate at your domain; most
platforms (Render, Railway, Heroku, AWS ACM + ALB) provision and renew
it automatically. `db/agri.db` is a single file — use a persistent disk
(or volume) so data survives redeploys, and note SQLite assumes a single
writer process, so a managed Postgres/MySQL is the right swap if you
later scale to multiple instances.

---

## 8. Plant catalog (Plant Explorer)

The Plant Explorer is driven entirely by seeded database rows — there is no
hardcoded crop list in component code. The single source of truth is:

- **`db/catalog/plant-catalog.json`** — every crop (64 today) with its
  common/scientific name, category, season, agronomy facts, description,
  market/demand data, and detail JSON (overview, agronomy, pests, resources).
  **Adding a crop = adding one object here.**
- **`db/catalog/commons-images.json`** — the verified image mapping
  (`slug → Wikimedia Commons file + URL`).
- **`db/migrations/006_apply_verified_plant_catalog.js`** — upserts the
  catalog into the `plants` table (idempotent, `ON CONFLICT(slug) DO UPDATE`)
  and refuses to run if any crop lacks a verified image.

### Why Wikimedia Commons images (the image-mismatch fix)

Crop photos used to come from Unsplash, whose opaque photo IDs made it
impossible to tell what a photo showed from its URL — which is how the
Onion card ended up showing potatoes. Commons files have **descriptive
filenames** (`File:Allium cepa.jpg` = onions), so a URL is auditable
against the crop name. The assignment pipeline is:

```bash
# 1. resolve image URLs by subject (Commons API, descriptive File: titles)
node scripts/resolve-commons-images.js

# 2. verify every URL exists (Commons API) + spot-loads (CDN sample)
node scripts/probe-commons-urls.js

# 3. data-integrity audit + regenerate the visual sign-off page
node scripts/audit-plant-catalog.js
#   → scripts/image-audit-verified.html  (eyeball every crop photo vs. name)

# 4. apply to the database
node db/migrations/run.js
```

Run `node scripts/audit-plant-catalog.js` after ANY catalog change — it
fails on duplicate slugs, reused/duplicate image URLs, empty detail data,
missing market/demand tags, or images whose filename doesn't match the crop.

### Adding a new crop (the supported path)

1. Add one object to `db/catalog/plant-catalog.json` (copy an existing
   entry's shape; fill every field accurately — no placeholders).
2. Add candidate Commons `File:` titles to `CANDIDATES` in
   `scripts/resolve-commons-images.js` and run it + `probe-commons-urls.js`.
3. Run `node scripts/audit-plant-catalog.js` and eyeball the regenerated
   `scripts/image-audit-verified.html`.
4. Run `node db/migrations/run.js` — the row is upserted, no code changes.

### Verification scripts

| Script | Purpose |
|---|---|
| `scripts/resolve-commons-images.js` | Resolve image URLs by subject via the Commons API |
| `scripts/probe-commons-urls.js` | Verify existence + sample-load every image URL |
| `scripts/audit-plant-catalog.js` | Data-integrity audit + visual audit page |
| `scripts/verify-catalog-db.js` | Verify the applied DB state (counts, dupes, empty fields) |
| `scripts/integration-test-plants.js` | Live API flow: register/login/crops/advice + catalog + search |
| `scripts/verify-plant-explorer-ui.js` | Playwright browser check of grid, images, search, filters, detail |

---

## 9. Extending this base

- Swap the rule-based/AI advice generator for a richer agronomy model
  (soil type, GPS-based rainfall data, pest alerts by region).
- Add a `farmer_crops` join table to let a user save multiple crops and
  see a personalized dashboard instead of re-selecting each visit.
- Add password reset (email a signed, short-lived reset token).
- Add MFA at login (see §5).
- Localize the UI strings (the crop names are already in Somali; the
  interface copy is in English by default — pull it into a small i18n
  dictionary keyed by locale).
