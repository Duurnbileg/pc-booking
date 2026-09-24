# PCBook — Gaming Center Booking (Phase 1)

Unified customer-facing discovery layer for Mongolian gaming centers.

Phase 1 includes auth, cafe listing/detail, PC status display, owner registration, and admin approval. Booking, QPay, Socket.IO, and live iCafeCloud sync come in later phases.

## Stack

- **Web:** Next.js 15 + TypeScript + Tailwind + TanStack Query
- **API:** Express + TypeScript + Mongoose + JWT (HTTP-only cookies)
- **DB:** MongoDB
- **Monorepo:** pnpm workspaces (`apps/web`, `apps/api`, `packages/shared`)

## Prerequisites

- Node.js 20+
- pnpm 9+
- MongoDB (local install, Atlas, or the bundled binary via `pnpm mongo`)

## Setup

```bash
# from repo root
pnpm install

cp .env.example apps/api/.env
# edit apps/api/.env — MONGODB_URI and JWT_SECRET are required

# Start local MongoDB (uses binary downloaded by mongodb-memory-server)
pnpm mongo

# in another terminal:
pnpm seed
pnpm dev
```

- Web: http://localhost:3000
- API root: http://localhost:4000/ (points to health)
- API health: http://localhost:4000/api/health

### API env (`apps/api/.env`)

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGODB_URI` | yes | Local URI, Atlas URI, or any Mongo connection string |
| `JWT_SECRET` | yes | Long random secret for auth cookies |
| `WEB_ORIGIN` | no | Defaults to `http://localhost:3000` (CORS) |
| `PORT` | no | Defaults to `4000` |
| `USE_MEMORY_DB` | no | Set `true` for in-memory Mongo (local demo) |
| `COOKIE_SECURE` | no | Set `true` in production (HTTPS) |

Web also needs `apps/web/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:4000` (see `.env.example`).

If the API fails to start with an Atlas “IP that isn't whitelisted” error, add your current IP in Atlas → Network Access (or `0.0.0.0/0` for local dev), then restart.

## Seed accounts

Password for all: `password123`

| Role | Email |
|------|-------|
| Admin | `admin@pcbooking.mn` |
| Cafe owner | `owner@pcbooking.mn` |
| Customer | `customer@pcbooking.mn` |

Seed also creates 3 approved Ulaanbaatar cafes with PCs (mixed statuses) and 1 pending cafe for the admin approve flow.

## Smoke checklist

1. Open `/` — see approved cafes
2. Open a cafe — see PC grid with status badges
3. Register / log in as customer
4. Log in as owner → `/owner/cafes/new` → submit cafe
5. Log in as admin → `/admin/cafes` → approve
6. Approved cafe appears on `/`

## Workspace scripts

| Command | Description |
|---------|-------------|
| `pnpm mongo` | Start local mongod (bundled binary) |
| `pnpm dev` | Run API + web concurrently |
| `pnpm seed` | Reset and seed MongoDB |
| `pnpm build` | Build shared, api, web |

## Phase 1 API

- `GET /` · `GET /api/health`
- `POST /api/auth/register|login|logout` · `GET /api/auth/me`
- `GET/POST/PATCH /api/cafes` · `GET /api/cafes/:idOrSlug` · `GET /api/cafes/:id/pcs`
- `GET /api/pcs/:id`
- `GET /api/owner/cafes` · `GET /api/owner/cafes/:id`
- `GET /api/admin/cafes/pending` · `POST /api/admin/cafes/:id/approve`

Integration adapters live under `apps/api/src/integrations/` (`MockCafeAdapter`, `ICafeCloudAdapter` stub).
