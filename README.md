# This needs to be SHORT

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
- [License](#license)

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
- 🚧 Backend currently uses npm while the frontend uses pnpm (npm was the choice before `@unwreck/core` existed). Migrating the backend, its Dockerfile, and CI to pnpm is tracked as an open issue.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose (for local PostgreSQL)
- pnpm (the repo is standardizing on pnpm; see [Status](#status) for the one exception)

## Local Development Setup

### 1. Start PostgreSQL

```bash
cd url-shortener-backend
docker compose up -d db
```

Starts a PostgreSQL 16 container (`shortener_db`) on port 5432.

### 2. Backend

Create `url-shortener-backend/.env`:

```env
DATABASE_URL=postgresql://admin:password@localhost:5432/shortener_db
DB_USER=admin
DB_PASSWORD=password
DB_NAME=shortener_db
PORT=3000
NODE_ENV=development
```

> `DB_USER` / `DB_PASSWORD` / `DB_NAME` are read by `docker-compose.yml` to initialize the Postgres container; the app itself connects using `DATABASE_URL`. Keep the credentials in both in sync.

```bash
pnpm install
pnpm run db:push
pnpm run dev
```

Runs on `http://localhost:3000`. Check `http://localhost:3000/ping` to confirm it's up.

> Note: this package still has a `package-lock.json` from before the pnpm migration (see [Status](#status)).

### 3. Frontend

```bash
cd url-shortener-frontend
pnpm install
```

Confirm `.env.development`:

```env
VITE_API_URL=/api
VITE_SHORT_BASE_URL=http://localhost:3000
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

## License

This project is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for details.
