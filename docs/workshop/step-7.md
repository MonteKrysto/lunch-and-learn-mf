# Step 7 (bonus) — When a Remote Is Down

**Start from:** your step-5 or step-6 state · **Ends at:** the state tagged `step-7`
**Solution files:** [`solutions/step-7/`](solutions/step-7/)

## Goal

Right now, one unreachable remote takes down the entire host: the MF runtime fetches
every declared remote's manifest at boot (one failure can blank the page), and a failed
`lazy()` remote unmounts the whole React tree. This step makes failure **local**: a dead
remote turns into a placeholder in its slot, and everything else keeps working.

Two layers, because there are two failure surfaces:

| Layer | Catches | Tool |
|---|---|---|
| React error boundary | a remote that loads but crashes while rendering (or a failed `lazy()`) | `RemoteBoundary` component |
| MF runtime plugin | the network layer: manifest unreachable, module fetch failed | `errorLoadRemote` hook |

## Do it (all in `apps/shell`)

**1. The boundary** — create `src/components/remote-boundary.tsx` (full file in
`solutions/step-7/`): a ~35-line class component with `getDerivedStateFromError`
that renders a dashed "this area couldn't load — the rest of the page is unaffected"
card instead of its children.

**2. Wrap every remote slot:**

- `src/router.tsx` — the claims route's element:

  ```tsx
  <RemoteBoundary name="claims">
    <Suspense fallback={…}>
      <ClaimsApp basename="/claims" />
    </Suspense>
  </RemoteBoundary>
  ```

- `src/pages/dashboard.tsx` — same wrapper around the worklist's `Suspense`.

**3. The runtime plugin** — create `src/mf-fallback.ts` (full file in solutions).
The single hook `errorLoadRemote` fires whenever a remote load fails, and the
`lifecycle` field tells you where:

- `'afterResolve'` → the **manifest** couldn't be fetched. Return a stub manifest
  (shaped like a real one, remoteEntry pointing nowhere) so boot survives; the
  module loads then fail individually into…
- `'onLoad'` → a **module** couldn't load. Return a factory for a tiny placeholder
  component: `() => ({ __esModule: true, default: RemoteUnavailable })`.

**4. Register it** — in `rsbuild.config.ts`, inside `pluginModuleFederation({...})`:

```ts
runtimePlugins: ['./src/mf-fallback.ts'],
```

## Break it, on purpose

The verification IS the demo. In store mode (step 6):

```bash
make store          # terminal 1
make publish app=uikit && make publish app=claims && make publish app=worklist
make host           # terminal 2
rm -rf .artifact-store/uikit     # ← "the uikit CDN is down"
```

Reload :3100 and enjoy the difference:

- The page **boots**. Nav, headers, metrics — alive.
- The four KPI slots render the plugin's placeholder: *"uikit/MetricCard" is
  unavailable right now.*
- The worklist slot shows the boundary card — worklist itself loaded, but its own
  uikit imports crashed its render, and the boundary contained it.
- Claims works perfectly. One team's outage stayed one team's outage.

Then `make publish app=uikit` again → reload → fully healed. (Dev-mode equivalent:
kill the uikit dev server instead.)

## Worth noticing

- **Every consumer owns its own resilience.** The shell's plugin covers the shell's
  loads. The worklist consuming uikit is the worklist's job — notice its slot fell
  back to the *boundary*, not the plugin. Exercise: add the same runtime plugin to
  the worklist and watch its slot degrade to per-badge placeholders instead.
- The placeholder component in the plugin uses inline styles, not Tailwind — it must
  render even when nothing else made it to the page.
- Boundaries don't retry: React's `lazy()` caches a rejection. A real app pairs this
  with a retry runtime plugin or a full-page reload affordance. Keep the demo honest
  about that.

**Stuck?** `diff` against [`solutions/step-7/`](solutions/step-7/) or `make catchup step=7`.
