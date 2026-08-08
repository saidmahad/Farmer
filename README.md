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

Any platform that runs a Node process works (Render, Railway, Fly.io,
AWS Elastic Beanstalk, a plain EC2/VM box behind nginx, etc.):

1. Set environment variables from `.env.example` in the platform's config
   (never commit a real `.env`).
2. Set `NODE_ENV=production` and `FORCE_HTTPS=true`.
3. Point the platform's managed TLS certificate at your domain (most
   platforms — Render, Railway, AWS ACM + ALB, Heroku — provision and
   renew this automatically).
4. `db/agri.db` is a single file — make sure the platform's filesystem
   is persistent (or mount a volume), or swap `better-sqlite3` for a
   managed Postgres/MySQL instance for multi-instance / serverless
   deployments, since SQLite assumes a single writer process.
5. `npm install --omit=dev && npm start` as the build/start commands.

---

## 8. Extending this base

- Swap the rule-based/AI advice generator for a richer agronomy model
  (soil type, GPS-based rainfall data, pest alerts by region).
- Add a `farmer_crops` join table to let a user save multiple crops and
  see a personalized dashboard instead of re-selecting each visit.
- Add password reset (email a signed, short-lived reset token).
- Add MFA at login (see §5).
- Localize the UI strings (the crop names are already in Somali; the
  interface copy is in English by default — pull it into a small i18n
  dictionary keyed by locale).
