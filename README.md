# This needs to be SHORT

[![CI](https://github.com/ejdhindsa/this-needs-to-be-short/actions/workflows/ci.yml/badge.svg)](https://github.com/ejdhindsa/this-needs-to-be-short/actions/workflows/ci.yml)

A clean, self-hosted URL shortener with custom slug creation and click analytics: no ads, no account required, no subscription to set a custom alias.

**Live:** <https://shortener.unwreck.dev> · **API:** <https://s.unwreck.dev/api/ping>

Part of the [unwreck.dev](https://unwreck.dev) project ecosystem.

## Table of Contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Design Decisions](#design-decisions)
- [Deployment & Rollback](#deployment--rollback)
- [Protections](#protections)
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
- Rate limiting on the API (50 requests/minute) with true client IP preservation to keep abuse at bay.

## Architecture

Two packages in this repo:

- **Backend** (`url-shortener-backend`): Fastify, TypeScript, PostgreSQL, Drizzle ORM. Zod for request validation. Handles link generation, click logging, and the redirect routes.
- **Frontend** (`url-shortener-frontend`): Vue 3 + Vite + TypeScript + Pinia, SCSS, styled with `@unwreck/core` design tokens.

### Request Flow & Infrastructure

```mermaid
---
config:
  theme: base
  sequence:
    mirrorActors: false
    actorMargin: 40
    width: 190
    height: 64
    boxMargin: 14
    boxTextMargin: 8
    noteMargin: 16
    messageMargin: 48
    messageAlign: center
    diagramMarginX: 30
    diagramMarginY: 20
---
sequenceDiagram
    autonumber
    actor User as Visitor / Client
    participant Pages as Cloudflare Pages<br/>(shortener.unwreck.dev)
    participant CF as Cloudflare Edge<br/>(s.unwreck.dev)
    participant Caddy as Caddy Proxy<br/>(VPS)
    participant App as Fastify Backend<br/>(shortener_app:3000)
    participant DB as PostgreSQL 16<br/>(shortener_db)

    rect rgba(100, 150, 255, 0.08)
        Note over User,Pages: 1. Creating a Short Link
        User->>Pages: Load UI
        Pages-->>User: Serve Vue 3 SPA + Turnstile widget
        User->>CF: POST /api/shorten (URL + turnstileToken)
        CF->>Caddy: Forward request (HTTP :80)
        Caddy->>App: Reverse proxy (Docker edge network)
        App->>App: Validate Turnstile + Safe Browsing
        App->>DB: Insert slug + original URL
        DB-->>App: Confirm insert
        App-->>User: 201 Created { shortCode, originalURL }
    end

    rect rgba(100, 200, 140, 0.08)
        Note over User,DB: 2. Resolving a Short Link
        User->>CF: GET /:shortCode
        CF->>Caddy: Forward request (HTTP :80)
        Caddy->>App: Reverse proxy (Docker edge network)
        App->>DB: Query target link + log click referrer
        DB-->>App: Return destination URL
        App-->>User: 302 Found (Location: destination URL)
    end
```

## Design Decisions

- **302 over 301 redirects:** 301 redirects get cached permanently by browsers and intermediate CDNs, which means repeat visitors never hit the server again; 302 forces each click to reach the backend so click counts and referrers are faithfully logged.
- **Fail-closed security:** If Google Safe Browsing times out or acts up, the API throws `503` and refuses to create the link—failing open might let malware or phishing past the gate just to keep the endpoint "available".
- **localStorage over accounts:** Link history belongs to the person who made it, right on their machine; skipping user accounts means no passwords, no email verification spam, and zero credentials in a database that could ever be breached.

## Deployment & Rollback

### Automated CI/CD Pipeline

Production deployments are automated via GitHub Actions on every merge to `main`:

1. **Test & Validation:** GitHub Actions runs backend tests with PostgreSQL service containers, executes frontend type checks and builds, and runs `typos`.
2. **Build & Publish:** The `deploy` job builds a production image using Docker Buildx, injects the Git commit SHA (`GIT_SHA=${{ github.sha }}`), and pushes tagged images (`:${{ github.sha }}` and `:latest`) to the GitHub Container Registry (`ghcr.io/ejdhindsa/shortener-backend`).
3. **SSH Deployment:** CI connects via SSH to the VPS on port 1313 using an ed25519 key restricted to a single forced command (`/usr/local/bin/deploy-shortener`).
4. **Zero-Git VPS Execution:** The deployment script pulls the specific commit tag from GHCR, updates the container (`docker compose up -d shortener`), and cleans up old images older than 7 days (`168h`).
5. **Health Verification:** CI polls `https://s.unwreck.dev/api/ping` until the response version matches the deployed commit SHA.

### Manual Rollback

If a release ever needs to be rolled back immediately without waiting for a git revert, trigger a deploy with the desired previous 40-character commit SHA:

```bash
ssh -p 1313 deploy@<host> <older-sha>
```

The server script validates the SHA format, pulls that specific container tag from GHCR, and restarts `shortener_app` without modifying git on the host.

## Protections

The shortener includes automated guards against abuse and malicious links:

- **Cloudflare Turnstile Verification:** Protects link creation against bots and scripted floods using Turnstile challenge tokens validated server-side.
- **Rate Limiting with Proxy Trust:** Globally capped at 50 requests per minute with exponential backoff via `@fastify/rate-limit`. Fastify has `trustProxy: true` enabled, correctly pulling visitor IPs from `CF-Connecting-IP` / `X-Forwarded-For` across Cloudflare and Caddy so rate limiting throttles individual visitors, not the reverse proxy.
- **Google Safe Browsing Check:** URLs submitted for shortening are screened against the Google Safe Browsing Lookup API (v4) for malware, social engineering (phishing), and unwanted software. Flagged links are rejected with `422` (`{ "error": "This URL is flagged as unsafe" }`).
- **Fail-Closed Security Behaviour:** If the Safe Browsing lookup times out (3-second deadline) or fails upstream, the API returns `503` (`{ "error": "Safety check unavailable, try again shortly" }`). The shortener fails closed rather than failing open: network timeouts or upstream service hiccups must never allow potentially dangerous URLs through. In non-production environments with no API key configured, the check logs a warning and is skipped for local convenience.
- **Self-Host & Loop Prevention:** URLs targeting `s.unwreck.dev` or `shortener.unwreck.dev` are rejected with `400` during validation to prevent circular redirect chains and infrastructure spoofing.

## Status

- ✅ **Backend:** live on VPS behind Caddy via automated GHCR CI/CD (`https://s.unwreck.dev/api/ping`).
- ✅ **Frontend:** live on Cloudflare Pages (`https://shortener.unwreck.dev`).
- ✅ **Protections:** Safe Browsing, Turnstile bot checks, proxy-aware rate limiting, fail-closed handling.
- 🚧 **Analytics Dashboard:** UI in progress (backend paginated API is complete and tested).

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

Migrations run automatically at startup before the server accepts traffic. The server runs on `http://localhost:3000`. Check `http://localhost:3000/api/ping` to confirm it's up.

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

All application endpoints are served under the `/api` prefix, with the exception of short link redirects which are resolved directly at the root (`/:shortCode`).

### Error Shape

API errors follow a consistent response shape:

```json
{
  "error": "Validation failed",
  "issues": [
    {
      "message": "This alias is reserved",
      "path": ["customCode"]
    }
  ]
}
```

- On validation failures (`400`), `error` is `"Validation failed"` accompanied by an array of Zod `issues`.
- Other non-2xx responses (e.g. `404`, `409`, `429`, `500`) return `{ "error": "<message>" }`.

### `POST /api/shorten`

```json
{
  "url": "https://example.com",
  "customCode": "my-alias",
  "turnstileToken": "0.xxxx..."
}
```

- `url` (string, required): valid HTTP/HTTPS address.
- `customCode` (string, optional): 3 to 32 characters, letters/numbers/underscores/hyphens (`[a-zA-Z0-9_-]`). Cannot match reserved aliases (case-insensitive).
- `turnstileToken` (string, optional in local dev; required in production): Cloudflare Turnstile token verified server-side.
- **Reserved aliases:** `api`, `ping`, `shorten`, `analytics`, `health`, `admin`, `static`, `assets`.

Response:

```json
{
  "shortCode": "my-alias",
  "originalURL": "https://example.com",
  "linkType": "custom",
  "createdAt": "2026-10-06T10:00:00.000Z"
}
```

| Status | Meaning                                                       |
| ------ | ------------------------------------------------------------- |
| `201`  | Link created                                                  |
| `400`  | Payload validation failed or self-host URL                    |
| `403`  | Turnstile verification failed (invalid or expired token)      |
| `409`  | Custom code already taken                                     |
| `422`  | URL flagged as unsafe by Safe Browsing                        |
| `429`  | Rate limit exceeded (capped at 50 requests/min per client IP) |
| `503`  | Safety check or Turnstile unavailable (fail-closed guard)     |

### `GET /:shortCode`

302 redirect to the original URL; logs referrer + timestamp. `404` if the code doesn't exist.

### `GET /api/analytics/:shortCode`

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

### `GET /api/ping`

Health check endpoint returning service status and deployment version:

```json
{
  "status": "ok",
  "version": "dev"
}
```

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
