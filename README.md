# This needs to be SHORT

[![CI](https://github.com/ejdhindsa/this-needs-to-be-short/actions/workflows/ci.yml/badge.svg)](https://github.com/ejdhindsa/this-needs-to-be-short/actions/workflows/ci.yml)

A clean, self-hosted URL shortener with custom slug creation and click analytics: no ads, no account required, no subscription to set a custom alias.

**Live:** <https://shortener.unwreck.dev>

Part of the [unwreck.dev](https://unwreck.dev) project ecosystem.

## Table of Contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Status](#status)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)
- [Contributing](#contributing)
- [Licence](#licence)

## What it does

- Short links use random 8-character base62 codes; the backend retries automatically on collisions.
- Custom aliases are supported too, checked for uniqueness before creation.
- Redirects are server-side 302s, and each click logs the referrer and timestamp.
- Click analytics are available through a paginated endpoint with referral-source breakdown (the frontend dashboard for this is still in progress; see [Status](#status)).
- QR codes are generated client-side, with a one-click PNG download.
- No accounts, no login: link history lives in the browser via local storage.
- Light and dark themes, built from `@unwreck/core` design tokens and the View Transitions API.
- Basic rate limiting on the API to keep it from being abused.

## Architecture

Two packages in this repo:

- **Backend** (`url-shortener-backend`): Fastify, TypeScript, PostgreSQL, Drizzle ORM. Zod for request validation. Handles link generation, click logging, and the redirect routes.
- **Frontend** (`url-shortener-frontend`): Vue 3 + Vite + TypeScript + Pinia, SCSS, styled with `@unwreck/core` design tokens.

## Status

- ✅ Backend: done (collision retry, rate limiting, analytics endpoint).
- 🚧 Frontend: in progress (dashboard for the analytics endpoint isn't built yet).

## Prerequisites

- Node.js 22+
- Docker and Docker Compose (for local PostgreSQL)
- pnpm

## Local Development Setup

### 1. Start PostgreSQL

```bash
cd url-shortener-backend
docker compose up -d db
```

Starts a PostgreSQL 16 container (`shortener_db`) on port 5432.

### 2. Backend

Copy the example environment file:

```bash
cd url-shortener-backend
cp .env.example .env
```

`url-shortener-backend/.env.example`:

```env
DATABASE_URL=postgresql://admin:password@localhost:5432/shortener_db
DB_USER=admin
DB_PASSWORD=password
DB_NAME=shortener_db
PORT=3000
NODE_ENV=development
SAFE_BROWSING_API_KEY=
TURNSTILE_SECRET_KEY=
```

> `DB_USER` / `DB_PASSWORD` / `DB_NAME` are read by `docker-compose.yml` to initialize the Postgres container; the app itself connects using `DATABASE_URL`. Keep the credentials in both in sync.

```bash
pnpm install
pnpm run dev
```

Migrations run automatically at startup before the server accepts traffic. The server runs on `http://localhost:3000`. Check `http://localhost:3000/ping` to confirm it's up.

#### Schema Changes & Migrations

- **Day-to-day workflow:** edit schema definitions in `src/db/schema/`, run `pnpm db:generate` to generate a versioned migration in `./drizzle`, and commit the generated files.
- **Local prototyping shortcut:** `pnpm db:push` is available to prototype schema tweaks directly against a local database without generating a migration.


### 3. Frontend

```bash
cd url-shortener-frontend
pnpm install
```

Copy the example environment file:

```bash
cp .env.example .env.development
```

`url-shortener-frontend/.env.example`:

```env
VITE_API_URL=/api
VITE_SHORT_BASE_URL=http://localhost:3000
VITE_TURNSTILE_SITE_KEY=
```

```bash
pnpm dev
```

Open `http://localhost:5173`. The dev server proxies `/api` to `http://localhost:3000`.

## API Reference

### `POST /shorten`

```json
{
  "url": "https://example.com",
  "customCode": "my-alias"
}
```

- `url` (string, required): valid HTTP/HTTPS address.
- `customCode` (string, optional): 3 to 32 characters, letters/numbers/underscores/hyphens.

| Status | Meaning                   |
| ------ | ------------------------- |
| `201`  | Link created              |
| `400`  | Payload validation failed |
| `409`  | Custom code already taken |

### `GET /:shortCode`

302 redirect to the original URL; logs referrer + timestamp. `404` if the code doesn't exist.

### `GET /analytics/:shortCode`

Query params: `page` (default `1`), `limit` (default `50`, max `100`).

```json
{
  "shortCode": "my-alias",
  "originalURL": "https://example.com",
  "linkType": "custom",
  "totalClicks": 25,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "clicks": [
    {
      "clickId": "4a7f0525-4c6e-473d-82d8-216c525f7560",
      "referrer": "https://news.ycombinator.com",
      "clickedAt": "2026-09-22T14:32:00.000Z"
    }
  ]
}
```

### `GET /ping`

`{ "status": "ok" }` (for health checks).

## Running Tests

```bash
cd url-shortener-backend
pnpm test
```

Backend tests use Vitest, colocated as `*.spec.ts`. New routes, validators, DB mutations, or utilities need coverage.

## Contributing

This is primarily a portfolio project, but issues, ideas, and PRs are welcome. Backend PRs need Vitest coverage. Untested backend changes won't be merged.

## Licence

[![Licence: GPL-3.0-or-later](https://img.shields.io/badge/Licence-GPL--3.0--or--later-blue.svg)](LICENSE)

This project is licensed under the GNU General Public License v3.0 or later. See [LICENSE](LICENSE) for details.
