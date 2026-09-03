# Lunch & Learn: Run of Show + Video Series Plan

Format: 60 minutes — 45 content, 15 Q&A. The live session is **animated deck + one
live demo block**, not a code-along. The hands-on work moves to a self-paced video
series: devs clone `main` (the zero-federation starter) and follow docs/workshop/.

Present from the deck (docs/slides/intro-animations.html, or the artifact link):
27 steps across six animated parts plus title/agenda/demo-cue/close slides.
Keys: `0`–`6` jump to parts, arrows step, `F` fullscreen, `R` replays an animation.

## Run of show (45 min)

The deck is ONE architecture diagram of the actual demo system, evolving across six
parts (22 steps total). Keys: 0-6 jump to parts, arrows step, F fullscreen, R replay.

| Time | Part | Deck steps | The diagram... |
|---|---|---|---|
| 0-2 | Title + agenda | 0-1 | - |
| 2-10 | 1 The Problem | 2-5 | monolith with shared-core conflicts -> deploy-queue jam -> the real team cards (uikit, claims+api+data, worklist) -> the empty shell with three slots |
| 10-17 | 2 Composition | 6-9 | uikit exposes chips -> MetricCard slot fills -> ClaimsApp mounts -> worklist fills + consumes uikit; react singleton badge |
| 17-27 | LIVE block | 10 | cue slide lists the five beats (below) |
| 27-32 | 3 Versioning | 11-13 | version chips per team -> uikit ships v3.1, open page keeps v3.0 -> reload composes v3.1 |
| 32-36 | 4 Data | 14-15 | HTTP fetch arrows to the claims api -> two contracts per slice |
| 36-40 | 5 Files | 16-17 | a remote = a folder -> the artifact store; deploy = file upload |
| 40-43 | 6 Failure | 18-20 | uikit unreachable -> blank page -> boundaries + errorLoadRemote -> graceful slot |
| 43-45 | Close | 21 | clone / videos / make catchup |

## Pre-session checklist (15 min before)

- [ ] `pnpm dev` running, all five banners show 3100/3101/3102/3103/4100 exactly
- [ ] Browser tabs open, in order: :3100 (shell), :3101 (uikit gallery), :3102 (claims standalone), :3103 (worklist standalone)
- [ ] Editor open to `apps/uikit/rsbuild.config.ts` and `apps/shell/rsbuild.config.ts` side by side
- [ ] Terminal font cranked up; a scratch terminal ready for the kill-a-remote bit
- [ ] Repo URL on a slide / in chat so people can clone during Q&A

## Segment details (beat-by-beat reference)

### 1. The problem microfrontends solve — 0:00–3:00

- Start with pain, not tech: one frontend repo, six teams, one deploy queue. Team A's
  release waits on Team B's broken test. Every dependency upgrade is a six-team meeting.
- Microfrontends = applying the microservices trade to the frontend: **independently
  developed, independently deployed** pieces composed into one product.
- Be honest about the cost: duplication, runtime complexity, version drift. This is a
  *team-scaling* tool, not a code-organizing tool. If one team owns the frontend, don't.

### 2. Module federation in one slide — 3:00–6:00

- Ways to compose MFEs: iframes (isolation, but clunky UX), npm packages (build-time —
  every consumer rebuilds/redeploys to pick up changes), server-side composition, and
  **runtime composition — module federation**.
- MF's core idea: an app can *expose* modules and *consume* modules from other deployed
  apps **at runtime**, with shared dependencies (React) negotiated to a single copy.
- Vocabulary you'll use for the rest of the demo: **host**, **remote**, `exposes`,
  `remotes`, `shared` + singleton. Mention MF 2.0 gives a manifest + **federated
  TypeScript types** — autocomplete across separately-deployed apps.

### 3. The demo — 6:00–18:00

All talk-track, no live coding. The audience codes later with the videos.

**Beat 1 — the illusion (2 min).** Show :3100. "One app, right?" Walk the tabs: the KPI
tiles come from :3101, the worklist from :3103, and Claims in the sidebar is the entire
app running on :3102 — four dev servers pretending to be one product. Each of these
directories is written as if it were its own repo owned by its own team.

**Beat 2 — remotes are runtime dependencies (2 min).** In the scratch terminal:
`kill $(lsof -nP -ti tcp:3101 -sTCP:LISTEN)` → reload :3100 → federation error in the
console. "This is the trade you're making: a remote is a runtime dependency, like an API.
You get independent deploys; you take on runtime failure modes." Restart with
`pnpm --filter uikit dev`.

**Beat 3 — the config that does it (3 min).** Show the two rsbuild configs side by side:
uikit's `exposes` + `shared` vs shell's `remotes` + `shared`. That's the entire mechanism —
maybe 15 lines. Point at `singleton: true` on react: "the #1 real-world footgun lives on
this line; the videos show you the error you get without it." Hover a `uikit/MetricCard`
import in the editor to show federated types autocomplete.

**Beat 4 — a whole application as a remote (3 min).** Click Claims, click into a claim,
show the URL `/claims/CLM-1014`, hit back, paste a deep link. Then show :3102 — same app,
standalone at `/`. One exposed component + a `basename` prop. "The claims team ships a
product; the platform team mounts it."

**Beat 5 — federation is a graph (2 min).** The worklist is consumed *by* the shell while
it consumes uikit's badges itself — host and remote at once. Everyone still gets exactly
one React. If time: open React Query devtools on :3100 and show the worklist's `denials`
query sitting in the shell's cache — state shared across apps via a singleton.

### 4. The pitch — 18:00–20:00

- "Everything you just saw is one `git clone`. What you clone is these five apps with
  **zero federation** — the videos add it back step by step, ~10 minutes each, and if
  you fall behind, `make catchup step=N` fast-forwards you. No git gymnastics."
- Takeaways to say out loud: MFEs are a team-scaling tool; module federation is runtime
  composition; singletons are where it bites; a remote is a runtime dependency.

### Q&A prep (20:00–30:00) — likely questions

- *"Why not just npm packages?"* Build-time vs runtime: with packages, every consumer must
  rebuild and redeploy to pick up a change; with MF the remote deploys once.
- *"What happens when a remote is down in prod?"* Same as beat 2 — you own that failure
  mode. Bonus step 7 adds the full fix: error boundaries per remote slot + an `errorLoadRemote` runtime plugin.
- *"How do remote URLs work across environments?"* We hardcode localhost; real deployments
  drive URLs per-environment via the MF runtime/manifest.
- *"Why is the manifest always mf-manifest.json?"* The URL is the identity; the filename is
  a well-known convention (like favicon.ico). `manifest.fileName` exists if you must.
- *"Do styles/Tailwind conflict?"* Each exposed module imports its own CSS (that's
  deliberate — video 2 covers it); identical utility definitions make collisions moot.
- *"So the remotes are running services somewhere?"* No — a deployed remote is
  static files (manifest, remoteEntry, chunks) on nginx/S3/any CDN. Nothing executes
  server-side; it runs only in the browser. Dev servers blur this — the docker stack
  is the honest picture. Only the API is a running process.
- *"Version mismatches between apps?"* Singleton negotiation picks one copy; mismatched
  ranges warn or error. Video 1 demos the failure on purpose.

## Video series

Each video starts from the previous tag and ends exactly at its own tag, so viewers can
diff (`git diff step-1 step-2`) or skip ahead (`git checkout step-2 && pnpm install`).
Record at the repo root with the relevant app's dev servers running.

| # | Title | Ref range | ~Length | Covers |
|---|-------|-----------|---------|--------|
| 0 | Setup & the cast | `start` | 6–8 min | Clone, `pnpm install`, `pnpm dev`, tour all five apps + API, monorepo layout, why zero shared packages (each app = a pretend repo), ports 3100–3103/4100 |
| 1 | Hello federation | `start` → `step-1` | 10–12 min | Install the MF plugin, uikit `exposes` its 4 components, shell `remotes` + consumes `MetricCard`, `shared` singletons — **break it on purpose** (remove `shared`, show the two-Reacts hook error, fix it), federated types + `@mf-types`, the exposed-module-owns-its-CSS rule |
| 2 | A whole app as a remote | `step-1` → `step-2` | 10–12 min | claims exposes `ClaimsApp`, shell mounts it at `claims/*` via `lazy` + `Suspense`, `basename` prop, deep links + back button, app still works standalone |
| 3 | A widget remote | `step-2` → `step-3` | 5–7 min | worklist exposes `WorklistWidget`, drops onto the dashboard; the pattern generalizes: page-sized or widget-sized, same mechanics |
| 4 | A remote becomes a host | `step-3` → `step-4` | 8–10 min | worklist adds its own `remotes` and consumes uikit's badges while the shell consumes *it*; federation is a graph; network tab shows uikit loaded once |
| 5 | Sharing state across apps | `step-4` → `step-5` | 8–10 min | `@tanstack/react-query` as a shared singleton, provider moves to worklist's bootstrap, embedded widget rides the shell's QueryClient — devtools shows one cache; why claims deliberately keeps its own |
| 6 | Independent deploys (finale) | `main` + docker | 6–8 min | `docker compose up --build`: one nginx per app, same ports as dev, cross-origin `remoteEntry` + CORS; stop `pnpm dev` first (and the stale-dev-chunk story if curious) |
| 7 | Bonus: the artifact store | step-6 (bonus) | 8–10 min | Remotes as pure artifacts: `make store` (pretend S3/Blob+CDN), `make publish app=X` per team, env-driven remote URLs (`ARTIFACT_STORE`), host + API as the only processes; deploy = file upload |
| 8 | Bonus: when a remote is down | step-7 (bonus) | 8–10 min | The crash nobody wants: dead remote = blank host. Fix in two layers — `RemoteBoundary` per slot, `errorLoadRemote` runtime plugin (stub manifest + placeholder modules); kill uikit live and watch the page degrade instead of die |

**Recording notes**

- Open each video by running `make catchup step=N-1` (fresh clone for video 1) and
  `pnpm install` on camera — that's the viewer's recovery path, so model it.
- Type the federation config live (it's short); paste the JSX edits.
- End each video at the tag state and say the tag name so viewers can self-verify with
  `git diff step-N` (empty diff = they nailed it).
- Videos 1–2 carry the core ideas; 3 is short by design (a breather); 4–5 are the payoff
  for people who want depth; 6 is optional.
