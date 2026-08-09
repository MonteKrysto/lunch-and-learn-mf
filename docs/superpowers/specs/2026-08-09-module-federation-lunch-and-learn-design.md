# Module Federation Lunch & Learn — Design

**Date:** 2026-08-09
**Status:** Approved
**Purpose:** A code-along lunch-and-learn teaching module federation in React. Attendees clone one repo, run everything standalone, then add federation live, step by step.

## Goals

- Teach module federation's core concepts (`exposes`, `remotes`, `shared`, singletons, federated types, host+remote graphs) through hands-on coding, not slides.
- Model a realistic multi-team architecture: each app is written as if it lived in its own repo owned by its own team.
- Front-load all setup pain (install, seed data, standalone apps) so session time is spent only on federation.

## Non-Goals

- No shared workspace packages of any kind. Duplication across apps is deliberate — it simulates independent repos and motivates runtime sharing.
- No SSR. All apps are client-side SPAs.
- No test suites. Verification bar is: typecheck passes and builds are green at every step tag.
- No auth, no real database, no production-grade error handling.

## Domain

The demo mirrors the team's real product: a **revenue cycle management (RCM) system for large hospitals**. Fake seeded data throughout.

## Architecture

Five workspaces: four frontend apps + one API. One host, three remotes; one remote converts to host+remote mid-session.

### `apps/shell` — "RCM Console" (host, port 3100)

The platform shell a hospital biller works in.

- Sidebar nav + header layout; owns top-level routing (`createBrowserRouter`).
- Dashboard landing page with KPI tiles: A/R days, clean claim rate, total denied dollars — fetched from claims-api with its own QueryClient.
- Consumes all three remotes (uikit components, the claims app, the worklist widget).

### `apps/uikit` — RCM design system (remote, port 3101)

Components-only remote. Exposes:

- `ClaimStatusBadge` — submitted / paid / denied / appealed
- `MetricCard` — KPI tile
- `AgingBadge` — 0-30 / 31-60 / 61-90 / 90+ A/R buckets
- `CurrencyText` — formatted dollar amounts

Built with shadcn/radix + tailwind. Standalone dev page is a component gallery so the app demos on its own.

### `apps/claims` — Claims Management (remote, port 3102)

A full application with its own routing and data layer.

- Routes: `/claims` (list with filters), `/claims/:id` (detail with status history + denial info).
- Own QueryClient; fetches from claims-api.
- Exposes exactly one module: `<ClaimsApp basename={...} />`. Standalone it mounts at `/`; in the shell it mounts under `/claims/*` with working URLs, deep links, and back button.

### `apps/worklist` — Denials Worklist (remote #3, port 3103)

Widget-sized: a compact table of denied claims to work today, sorted by dollars at risk. Fetches from claims-api with its own QueryClient.

- **Starts** fully self-contained with its own plain styling.
- **Converts mid-session** to host+remote: consumes `ClaimStatusBadge` / `AgingBadge` from uikit while still being consumed by the shell. Resulting graph: shell → worklist → uikit.

### `apps/claims/api` — the single API (port 4100)

- **Express + TypeScript.** In-memory seeded fake data (~50 claims across several payers, statuses, denial reasons, aging buckets).
- CORS middleware (all frontends are cross-origin to it).
- Endpoints: claims list (filterable), claim by id, denials, dashboard KPI summary.
- Deliberate scope cut: exactly one API. A second API adds docker services and terminal noise without teaching anything new.

## Tech Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Bundler | Rsbuild + `@module-federation/rsbuild-plugin` (MF v2) | First-class MF support; federated TS types (`dts: true`) are the live wow-moment |
| React | React 19 | Current |
| Routing | react-router v8 **library mode** (`createBrowserRouter` + `RouterProvider`) | Proven with MF; explicit route objects make the mounting lesson visible in code |
| Shared deps | `react` / `react-dom` as shared singletons everywhere | Demo the version-mismatch error first (the #1 real-world footgun), then fix it |
| Styling | Tailwind v4 + shadcn per app, fully duplicated | No shared packages; double-loaded preflight is harmless and a talking point |
| Data | TanStack Query, one QueryClient per app | Singleton-sharing is the optional finale, not the default |
| Monorepo | pnpm workspaces + turborepo as task runner only | `turbo dev` starts all five; zero `packages/` |
| API | Express + TypeScript | Team familiarity |

The existing `create-react-router` scaffold at the repo root is deleted; all apps are scaffolded fresh with Rsbuild.

## Repo Layout

```
apps/
  shell/        # host
  uikit/        # components remote
  claims/       # full-app remote
  worklist/     # widget remote → host+remote
services/
  claims-api/   # Express API
turbo.json
pnpm-workspace.yaml
docker-compose.yml
README.md       # doubles as the session runbook
```

Each app owns its own tailwind config, shadcn components, and tsconfig. Every `package.json` is written as if the app could be extracted to its own repo tomorrow.

## Code-Along Structure

The repo ships on a `start` branch: **all five services fully working standalone, zero federation anywhere.** Attendees clone, `pnpm install`, `turbo dev` before the session — five working apps immediately.

Live session steps (git tags `step-1` … `step-5` as catch-up checkpoints; `main` holds the final state):

1. **Step 1 — hello federation.** uikit exposes components; shell consumes them on the dashboard. Teaches `exposes` / `remotes` / `shared` + federated types autocomplete.
2. **Step 2 — a whole app as a remote.** claims exposes `ClaimsApp`; shell mounts it under `/claims/*`. Teaches routing composition and basename handling.
3. **Step 3 — widget remote.** worklist exposed and mounted on the shell dashboard.
4. **Step 4 — remote becomes host+remote.** worklist consumes uikit's badges while still being consumed by the shell. Teaches federation-as-a-graph and transitive shared-dependency resolution.
5. **Step 5 (stretch).** Share the QueryClient as a federation singleton (shell + worklist stop double-fetching denials), and/or the docker-compose finale.

## Docker

One `docker-compose.yml` at the root:

- Four nginx containers serving each app's production static build.
- One node container running claims-api.
- **Containers publish the same ports as dev** (3100-3103, 4100), so `remoteEntry` URLs are identical in both modes — zero env-var plumbing. Talking note: real deployments drive remote URLs per-environment via the MF runtime/manifest.
- nginx sends CORS headers for cross-origin `remoteEntry` fetches — its own small lesson.

The code-along runs on local `turbo dev`; docker is the "this is what independent deploys look like" finale.

## Verification

- `turbo typecheck` and `turbo build` green at `start`, every `step-*` tag, and `main`.
- Pre-session dry run (scripted in the README): fresh clone → `pnpm install` → `turbo dev` → walk every step tag → `docker compose up`.

## Open Items

- Exact seed-data shape (payer names, denial reason codes) decided during implementation.
- Whether step 5 does QueryClient sharing, docker finale, or both depends on session pacing — build both, present as time allows.
