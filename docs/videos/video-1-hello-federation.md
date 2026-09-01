# Video 1 — Hello Federation (10–12 min)

**Teaches:** `exposes` / `remotes` / `shared` singletons, federated types, and the two
failure modes (dead remote, unshared React) that make the mechanism believable.
**Starts from:** end of video 0 — fresh clone, `pnpm dev` running, five standalone apps.
**Ends at:** the state tagged `step-1` (workshop guide: `docs/workshop/step-1.md`).

## Pre-flight (before recording)

- [ ] Fresh state: clean clone (or `git checkout . && git clean -fd apps` to reset), `pnpm install`, `pnpm dev` running, banners show 3100–3103/4100
- [ ] Browser tabs, in order: :3100 (shell), :3101 (uikit gallery)
- [ ] Editor tabs open: `apps/shell/src/components/kpi-tile.tsx`, `apps/uikit/src/components/metric-card.tsx`, both `rsbuild.config.ts` files
- [ ] Terminal at repo root + big font; network tab docked and cleared
- [ ] Know your reset: if a take goes sideways, `git checkout . && git clean -fd apps && pnpm install`, restart dev

---

## 0:00–0:40 · Cold open — the promise

**Screen:** shell dashboard on :3100, then a hard cut to uikit's gallery on :3101.

**Say:** "Two apps, two dev servers, two pretend teams. By the end of this video, the
shell will render a component that *lives in the other app* — no npm package, no
copy-paste, fetched at runtime. About ten minutes."

**Recovery line (always the same):** "Joining here? You need video 0's state: clone the
repo, `pnpm install`, `pnpm dev`."

## 0:40–2:00 · The setup — duplicated effort, on purpose

**Screen:** split editor — `kpi-tile.tsx` (shell) beside `metric-card.tsx` (uikit).

**Do:** scroll both slowly; they're nearly the same component.

**Say:** "The design-system team shipped MetricCard. The shell team, who can't import
across repos, hand-rolled KpiTile. Same component, two owners — this is what build-time
isolation costs, and it's the thing we're about to delete."

**Beat:** point at the gallery on :3101 — "their component already runs *here*. We just
can't reach it… yet."

## 2:00–3:20 · Install the plugin — two teams, two installs

**Screen:** terminal.

**Type:**

```bash
pnpm --filter uikit add -D @module-federation/rsbuild-plugin
pnpm --filter shell add -D @module-federation/rsbuild-plugin
```

**Say:** "One plugin, installed twice — each app owns its own dependencies, because in
real life these are different repos. Notice nothing about this repo is shared between
them: no common package, no shared config. That's deliberate."

## 3:20–5:40 · uikit becomes a remote

**Screen:** `apps/uikit/rsbuild.config.ts`. **Type the federation block live** (it's
short; typing it is the lesson — full file: `docs/workshop/solutions/step-1/`):

```ts
pluginModuleFederation({
  name: 'uikit',
  exposes: {
    './ClaimStatusBadge': './src/components/claim-status-badge.tsx',
    './MetricCard': './src/components/metric-card.tsx',
    './AgingBadge': './src/components/aging-badge.tsx',
    './CurrencyText': './src/components/currency-text.tsx',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
}),
```

**Narrate while typing:** `name` — "how consumers will address us." `exposes` — "our
public API: four components, by path. Everything not listed stays private." `shared` —
"hold that thought; it's the most important lines in the file and we'll break them later
on purpose."

**Then add** (top level of the config):

```ts
server: { port: 3101, cors: true },
dev: { assetPrefix: 'http://localhost:3101' },
output: { assetPrefix: 'http://localhost:3101' },
```

**Say:** "A remote must know its own public address — its code will execute inside
someone else's page, and its chunks have to resolve back to *this* server. CORS because
that load is cross-origin."

**Do:** restart uikit's dev server (**call out**: "config changes need a restart — HMR
doesn't cover rsbuild.config"). Then open http://localhost:3101/mf-manifest.json in the
browser, point at `exposes` and `remoteEntry`.

**Say:** "Publishing is unilateral — uikit is now serving a manifest and a remote entry,
and nobody is consuming it. Like publishing a package, except it's *live*."

## 5:40–7:40 · shell becomes a host — the moment

**Screen:** `apps/shell/rsbuild.config.ts`. **Type:**

```ts
pluginModuleFederation({
  name: 'shell',
  remotes: {
    uikit: 'uikit@http://localhost:3101/mf-manifest.json',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
}),
```

**Say:** "The host's side of the handshake: a name and a manifest URL. That's the entire
integration contract between these two teams."

**Then** `apps/shell/tsconfig.json` → add `"paths": { "*": ["./@mf-types/*"] }` — "this
wires up federated *types*; you'll see the payoff in a minute."

**Then** `apps/shell/src/pages/dashboard.tsx`:

```tsx
import MetricCard from 'uikit/MetricCard';
```

Swap the four `<KpiTile` usages to `<MetricCard` (same props), **delete
`kpi-tile.tsx` with ceremony** — "the shell team just deleted their fork."

**Do:** restart shell dev → reload :3100.

**The moment — slow down here:** "These four tiles are now rendering code that lives in
the uikit app. Don't believe me?" → edit `metric-card.tsx` in uikit (bump a font size or
change the card border), save → **shell hot-updates**. "That's another team's component,
in our page, updating live."

## 7:40–9:00 · Prove it's real — network tab + dead remote

**Screen:** :3100 with network tab, filter `3101`.

**Walk the chain:** `mf-manifest.json` → `uikit.js` ("that's the remote entry — the
classic remoteEntry.js, named after the remote") → `__federation_expose_MetricCard.js`.
"Manifest, front door, then just the component you asked for."

**Kill it:** in the scratch terminal:

```bash
kill $(lsof -nP -ti tcp:3101 -sTCP:LISTEN)
```

Reload :3100 → federation error in console. **Say:** "A remote is a *runtime*
dependency. And be precise about what I just killed: a **file server**, not an app.
In production a remote isn't a running program — it's static files on a CDN. This
error means 'the file host is unreachable', the frontend equivalent of a CDN outage."

Restart: `pnpm --filter uikit dev`. Reload — healed.

**The physical-reality beat (30s, do not skip):** in the scratch terminal:

```bash
pnpm --filter uikit build && ls apps/uikit/dist/static/js
```

**Say over the file list:** "THIS is what the uikit team deploys. A folder: a manifest,
a remote entry, some chunks, some CSS. No Node server, no process, nothing executing —
you could host this on S3 or GitHub Pages. The dev server we killed only exists in
development. A remote *runs* in exactly one place: the browser. And when you finish
the series, `make static` runs the entire product this way — every app served as
nothing but files."

## 9:00–10:30 · Break it on purpose — the singleton lesson

**Screen:** both rsbuild configs.

**Do:** delete the `shared` block from **both** apps, restart both dev servers, reload
:3100. **The page still works** — say so, because that's the trap.

**Show the receipts:** network tab, filter `react` → TWO `lib-react.js` requests, one
from :3100 and one from :3101 (check the Domain column). "Two copies of React on one
page. And nothing crashed — because uikit's components don't use hooks *yet*. Two
Reacts is a time bomb, not a grenade. Watch it detonate:"

**Detonate it:** add a hook to uikit's `metric-card.tsx`:

```tsx
import { useState } from 'react';
// first line inside MetricCard:
const [hovered] = useState(false);
```

Save → console shows the invalid-hook/dispatcher error. "The uikit team added one
innocent hook and every consumer just went down. THAT is the two-React bug — it ships
silently and detonates on someone else's harmless change."

**Say:** "`singleton: true` tells federation: negotiate ONE copy for everyone. This
single line is the number-one module federation production bug. When you see a nonsense
hooks error in a federated app, check `shared` first."

**Do:** restore both `shared` blocks (keep the hook!), restart, reload — works, and the
:3101 `lib-react.js` request is gone. Then remove the demo hook. (Don't skip the
restores on camera — viewers mirror you.)

## 10:30–11:30 · Types, CSS, verify, out

- **Federated types:** in `dashboard.tsx`, hover `MetricCard`, then ctrl-space its props
  — "autocomplete, from a component in another running app. The types were fetched from
  the remote into that gitignored `@mf-types` folder." (Squiggles instead? "run
  `pnpm dev` once, restart your TS server" — say it, it's the #1 viewer stumble.)
- **CSS rule, 20 seconds:** open `metric-card.tsx`, point at `import '../index.css'` —
  "already there since the start: an exposed module must own its styles. The host will
  not build your CSS for you. Forget this and your component arrives naked."
- **Verify checklist (pause here):** tiles render from uikit · network shows
  manifest → uikit.js → expose chunk · killing uikit breaks the shell, restarting heals
  it · autocomplete works on `uikit/MetricCard`.
- **Stuck?** "`diff` against `docs/workshop/solutions/step-1/`, or `make catchup step=1`
  and meet me in video 2."
- **Tease:** "Next: not a component — an entire application, with its own router, mounted
  inside the shell."

---

## Cutaway / graphics notes

- During 3:20 (`exposes`/`shared` explanation), optionally cut to the "One App, Many
  Teams" deck, Part 2 step 3 (runtime composition) for 10 seconds.
- Keep one persistent lower-third during typing segments: `docs/workshop/step-1.md has
  every edit in this video`.

## Known live-demo pitfalls

- Forgetting to restart a dev server after an rsbuild.config edit (most common retake).
- Typo in the manifest URL (`mf-manifest.json`) — the error appears in the *browser
  console*, not the terminal.
- If ports were taken by an earlier take: `make ports`, kill the stragglers.
