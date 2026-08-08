# Agri-Advisor — single-process image (API + React SPA + SQLite).
# Works on any container platform: Render (Docker), Railway, Fly.io, etc.

FROM node:20-bookworm-slim

# Build tools for better-sqlite3 (native module) when prebuilt binaries
# are unavailable for the platform.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend dependencies (lockfile-pinned, reproducible builds).
COPY package.json package-lock.json ./
RUN npm ci

# Frontend dependencies + build the SPA into web/dist.
COPY web/package.json web/package-lock.json web/
RUN cd web && npm ci
COPY web/ web/
RUN cd web && npm run build

# Rest of the backend (routes, db, migrations, catalog).
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Migrations are idempotent — safe to run on every boot.
CMD ["npm", "start"]
