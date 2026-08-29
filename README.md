# Module Federation Lunch & Learn — RCM Console

A code-along teaching module federation in React. Four apps + one API, modeled on a
hospital revenue cycle management (RCM) platform. Each app is written as if it lived in
its own repo owned by its own team — this monorepo is just so you only clone once.

| App | Port | Role |
|---|---|---|
| `apps/shell` | 3100 | RCM Console — the host |
| `apps/uikit` | 3101 | Design system components — remote |
| `apps/claims` | 3102 | Claims Management — a full app as a remote |
| `apps/worklist` | 3103 | Denials Worklist widget — remote, later host+remote |
| `apps/claims/api` | 4100 | Express API (fake seeded data) |

## Before the session (please do this ahead of time!)

Prereqs: Node 22+, pnpm 10 (`corepack enable`) (or `npm i -g pnpm@10` if your Node doesn't
bundle corepack), Docker Desktop (optional, for the finale).

```bash
git clone <repo-url> && cd lunch-and-learn-mfe
git checkout start
pnpm install
pnpm dev
```

Open all five: http://localhost:3100 (shell), :3101 (uikit gallery), :3102 (claims),
:3103 (worklist), :4100/health (api). Five independent apps, zero federation — yet.

## Session steps

**Working through this on your own (or with the videos)?** Follow the written
guides in [docs/workshop/](docs/workshop/README.md) — one per step, each with a
`solutions/step-N/` folder holding the final version of every file that step
touches. You never need to leave your own branch.

We code each step live. Fall behind? Jump to the checkpoint:

```bash
git stash && git checkout step-2   # or step-1..step-5
pnpm install
```

Several steps add new dependencies (step-1: `@module-federation/rsbuild-plugin` in uikit +
shell; step-2: same plugin in claims; step-3: same in worklist; step-5:
`@tanstack/react-query-devtools` in shell) — always re-run `pnpm install` after a checkout.

1. **step-1 — Hello federation.** uikit exposes its components; shell consumes them.
   `exposes` / `remotes` / `shared` singletons + federated TypeScript types.
2. **step-2 — A whole app as a remote.** claims exposes `ClaimsApp`; shell mounts it
   under `/claims/*`. Routing composition and `basename`.
3. **step-3 — Widget remote.** worklist lands on the shell dashboard.
4. **step-4 — A remote becomes a host.** worklist consumes uikit while the shell
   consumes worklist. Federation is a graph, not a tree.
5. **step-5 — Sharing state (stretch).** `@tanstack/react-query` becomes a shared
   singleton; the worklist widget rides the shell's QueryClient and cache.

## The finale: independent deploys

```bash
docker compose up --build
```

Same five URLs — but now every app is its own image behind its own nginx, and the shell
is loading remotes cross-origin exactly like independently deployed micro-frontends.

## Troubleshooting

- **Port in use:** something else owns 3100-3103/4100; kill it or restart. Rsbuild silently
  picks the next free port if its port is taken, and every app *looks* fine while
  federation breaks because the hard-coded remote URLs still point at the original ports —
  check each dev server's startup banner shows exactly 3100/3101/3102/3103.
- **Blank page after checkout:** re-run `pnpm install` (deps change between steps), restart `pnpm dev`.
- **Remote fails to load:** is the remote's dev server running? Check the browser console
  for the failing `mf-manifest.json` URL.
- **Red squiggles / typecheck errors on `uikit/...` or other federated imports** after
  checking out a step: run `pnpm dev` once — federated TypeScript types are fetched from
  the running remotes into each consumer's gitignored `@mf-types/` folder — then restart
  your editor's TS server.
