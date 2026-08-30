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
pnpm install
pnpm dev
```

That's the whole setup — what you cloned IS the starting point. Open all five:
http://localhost:3100 (shell), :3101 (uikit gallery), :3102 (claims),
:3103 (worklist), :4100/health (api). Five independent apps, zero federation — yet.

## Session steps

You add the federation yourself, step by step — live in the session, or self-paced
with the videos. Follow the written guides in [docs/workshop/](docs/workshop/README.md):
one per step, each with a `solutions/step-N/` folder holding the final version of
every file that step touches. No git required at any point.

Fall behind or joining late? One command fast-forwards your code to the end of any
step (applies the solution files and installs the deps they need):

```bash
make catchup step=2
```

(The finished build lives on the `final` branch, with tags `step-1`…`step-5` marking
each stage — presenter material; you won't need them.)

1. **step-1 — Hello federation.** uikit exposes its components; shell consumes them.
   `exposes` / `remotes` / `shared` singletons + federated TypeScript types.
2. **step-2 — A whole app as a remote.** claims exposes `ClaimsApp`; shell mounts it
   under `/claims/*`. Routing composition and `basename`.
3. **step-3 — Widget remote.** worklist lands on the shell dashboard.
4. **step-4 — A remote becomes a host.** worklist consumes uikit while the shell
   consumes worklist. Federation is a graph, not a tree.
5. **step-5 — Sharing state (stretch).** `@tanstack/react-query` becomes a shared
   singleton; the worklist widget rides the shell's QueryClient and cache.

## Run it like it's deployed (no docker needed)

```bash
make static
```

Builds every app, then serves each one's `dist/` as plain static files — no dev
servers, no HMR. This is what "deployed" means for a remote: files on a host,
running only in your browser. (Stop `pnpm dev` first — same ports.)

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
- **Blank page after a catch-up:** re-run `pnpm install` (steps add dependencies), restart `pnpm dev`.
- **Remote fails to load:** is the remote's dev server running? Check the browser console
  for the failing `mf-manifest.json` URL.
- **Red squiggles / typecheck errors on `uikit/...` or other federated imports** after
  wiring up a step: run `pnpm dev` once — federated TypeScript types are fetched from
  the running remotes into each consumer's gitignored `@mf-types/` folder — then restart
  your editor's TS server.
