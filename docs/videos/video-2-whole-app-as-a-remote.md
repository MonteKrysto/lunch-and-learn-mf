# Video 2 — A Whole App as a Remote (10–12 min)

**Teaches:** routing composition — mounting a complete application (own router, own
data layer) under a host route via one exposed module and a `basename` contract.
**Starts from:** end of video 1 (the state tagged `step-1`).
**Ends at:** the state tagged `step-2` (workshop guide: `docs/workshop/step-2.md`).

## Pre-flight (before recording)

- [ ] State = end of step 1 (or `make catchup step=1` on a clean tree), `pnpm dev` running
- [ ] Browser tabs: :3100 (shell — dashboard shows uikit tiles), :3102 (claims standalone)
- [ ] Editor tabs: `apps/claims/src/ClaimsApp.tsx`, `apps/claims/src/bootstrap.tsx`, `apps/shell/src/router.tsx`, `apps/claims/rsbuild.config.ts`
- [ ] Network tab docked; know the reset (`make catchup step=1` rebuilds this video's start)

---

## 0:00–0:40 · Cold open — the promise

**Screen:** :3102 — click through the claims list into a detail page, hit back.

**Say:** "This is not a component. It's an application — its own routes, its own data
fetching, its own team. In ten minutes it'll be running *inside* the shell, with the URL
bar, deep links, and the back button all working. And the claims team will change almost
nothing."

**Recovery line:** "Joining here? `make catchup step=1` puts you exactly where I'm starting."

## 0:40–2:10 · Tour — this app was built to be mounted

**Screen:** `ClaimsApp.tsx`.

**Point at three things:**

1. The routes: `'/'` (list) and `'/:claimId'` (detail) — "notice they're *relative to
   nothing*. No `/claims` prefix anywhere in this app."
2. The prop: `{ basename = '/' }` feeding `createBrowserRouter` — "one prop. It says:
   'wherever you mount me, tell me my prefix.' That's the entire contract."
3. The provider: its own `QueryClient` inside the component — "the data layer travels
   with the app, not with the page."

**Then `bootstrap.tsx`:** "standalone, it mounts itself with `basename='/'`. The app has
two lives; we're about to add the second one."

**Say:** "This is the design lesson of the episode: *mountable apps are built, not
retrofitted*. Relative routes + a basename prop — decide this on day one and federation
is trivial. Retrofit absolute paths later and it's a rewrite."

## 2:10–3:30 · claims becomes a remote

**Terminal:**

```bash
pnpm --filter claims add -D @module-federation/rsbuild-plugin
```

**Screen:** `apps/claims/rsbuild.config.ts` — **type it live** (same shape as video 1,
so move quicker; full file in `docs/workshop/solutions/step-2/`):

```ts
pluginModuleFederation({
  name: 'claims',
  exposes: {
    './ClaimsApp': './src/ClaimsApp.tsx',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
}),
```

plus the self-address block:

```ts
server: { port: 3102, cors: true },
dev: { assetPrefix: 'http://localhost:3102' },
output: { assetPrefix: 'http://localhost:3102' },
```

**Narrate:** "One expose. Not the pages, not the router, not the API client — just
`ClaimsApp`. The smaller the exposed surface, the smaller the runtime contract — this
team can refactor everything behind that one module without telling anybody."

**Do:** restart claims dev; flash http://localhost:3102/mf-manifest.json — "one expose,
as advertised."

## 3:30–4:10 · shell learns the address

**Screen:** `apps/shell/rsbuild.config.ts`:

```ts
remotes: {
  uikit: 'uikit@http://localhost:3101/mf-manifest.json',
  claims: 'claims@http://localhost:3102/mf-manifest.json',
},
```

**Say:** "Second remote, same handshake. The shell's world model is just this list —
names and manifest URLs."

## 4:10–6:10 · Mount it — and break it first

**Screen:** `apps/shell/src/router.tsx`. **Type:**

```tsx
import { lazy, Suspense } from 'react';

const ClaimsApp = lazy(() => import('claims/ClaimsApp'));
```

Replace the placeholder route — but **first mount it WRONG, on purpose** (leave off the
prop):

```tsx
{
  path: 'claims/*',
  element: (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading claims app…</p>}>
      <ClaimsApp />
    </Suspense>
  ),
},
```

**Do:** delete `apps/shell/src/pages/claims-placeholder.tsx` and its import; restart
shell; click Claims in the sidebar.

**The break:** the app mounts but it's wrong — the inner router thinks it lives at `/`,
so the URL `/claims` doesn't match its routes (you'll get the router's no-match state /
a blank area). **Say:** "The app loaded fine — federation did its job. The *routing
contract* is what's broken: ClaimsApp thinks it owns the whole URL. It needs to be told
its prefix."

**The fix:** `<ClaimsApp basename="/claims" />` → save → working list inside the shell.

**Say:** "One prop. That's what makes an app mountable."

## 6:10–7:30 · The moment — walk the URL

**Screen:** :3100, slowly.

1. Click Claims → list renders inside the shell chrome.
2. Click a claim → URL bar reads `/claims/CLM-1014`. "The claims team's route, wearing
   the shell's prefix."
3. Browser back → list. "History just works — both routers read the same URL."
4. **Paste `http://localhost:3100/claims/CLM-1014` into a new tab** → detail page cold-loads.
   "Deep links survive. This is the test most microfrontend setups fail."

## 7:30–8:40 · Two bonus proofs

- **Lazy loading:** network tab, clear, reload the *dashboard* — "filter `3102`:
  nothing. The claims app doesn't exist until someone visits it." Click Claims → watch
  the manifest, remoteEntry, and chunks arrive. "`lazy()` was a nicety for a card; for a
  whole app it's the difference between composing and bloating."
- **Standalone unchanged:** switch to :3102, click around — "same code, same server,
  mounted at `/` for the claims team's own workflow, at `/claims` inside the platform.
  Nobody forked anything."

## 8:40–10:30 · Mechanics recap, verify, out

**Say over a split of `ClaimsApp.tsx` + `router.tsx`:**

- "Two routers are alive on this page: the shell's owns the URL bar and matched
  `claims/*`; the inner one matched what's *after* the prefix. `basename` is the
  treaty line between them."
- "Everything the app needs travels with it — router, QueryClient, styles (that
  `import './index.css'` at the top: same CSS-ownership rule as video 1)."
- "And notice what the claims team had to change to be embedded: their rsbuild config.
  Zero application code."

**Verify checklist (pause here):** claims renders inside the shell · URL shows
`/claims/CLM-…` on detail · back button works · deep link in a fresh tab works ·
:3102 standalone unchanged · dashboard loads nothing from :3102 until Claims is clicked.

**Stuck?** "`diff` against `docs/workshop/solutions/step-2/`, or `make catchup step=2`."

**Tease:** "Next one's short: a third remote, widget-sized, five minutes — and then
things get interesting, because that widget is going to start consuming remotes of
its own."

---

## Cutaway / graphics notes

- At 6:10 (URL walk), a lower-third with the treaty diagram helps:
  `shell router: /claims/*  →  ClaimsApp(basename="/claims")  →  inner routes: / and /:claimId`.
- Keep the persistent lower-third: `docs/workshop/step-2.md has every edit in this video`.

## Known live-demo pitfalls

- Mounting wrong-on-purpose *before* deleting the placeholder import → dead-code lint
  noise on screen. Delete the placeholder file and import first (script order above).
- Forgetting the claims dev-server restart after the config edit — the shell then shows
  a manifest fetch error for :3102 (good improv moment: it's video 1's dead-remote error).
- If the deep-link paste 404s: you typed a claim id that doesn't exist in the seed —
  grab one from the list first.
