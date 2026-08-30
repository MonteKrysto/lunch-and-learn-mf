# Video 3 — A Widget Remote (5–7 min)

**Teaches:** the federation pattern generalizes — widget-sized this time; deliberately
short and repetitive, because the rep IS the lesson.
**Starts from:** end of video 2 (the state tagged `step-2`).
**Ends at:** the state tagged `step-3` (workshop guide: `docs/workshop/step-3.md`).

## Pre-flight

- [ ] State = end of step 2 (`make catchup step=2` on a clean tree), `pnpm dev` running
- [ ] Browser tabs: :3100 (dashboard), :3103 (worklist standalone)
- [ ] Editor tabs: `apps/worklist/rsbuild.config.ts`, `apps/shell/rsbuild.config.ts`, `apps/shell/src/pages/dashboard.tsx`

---

## 0:00–0:30 · Cold open — the challenge

**Screen:** :3103, the standalone worklist.

**Say:** "Third remote. A widget this time — the denials worklist, onto the dashboard.
Here's the thing: you've now seen this pattern twice, so before I do it — **pause this
video and try it yourself.** Everything you need: expose `./WorklistWidget`, wire it
into the shell, render it under the KPI tiles. Guide's in `docs/workshop/step-3.md`.
Seriously — pause. I'll do it in four minutes when you're back."

**Recovery line:** "Joining here? `make catchup step=2`."

## 0:30–3:30 · Speed-run (for those who didn't pause)

Move quicker than videos 1–2 — narration is pattern-recognition, not explanation.

**1.** `pnpm --filter worklist add -D @module-federation/rsbuild-plugin`

**2.** `apps/worklist/rsbuild.config.ts` — "same three blocks, third time":

```ts
pluginModuleFederation({
  name: 'worklist',
  exposes: {
    './WorklistWidget': './src/WorklistWidget.tsx',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
}),
```

```ts
server: { port: 3103, cors: true },
dev: { assetPrefix: 'http://localhost:3103' },
output: { assetPrefix: 'http://localhost:3103' },
```

Restart worklist dev. **Say while typing:** "Name, exposes, shared. Self-address, CORS.
If you can rattle those off, you know module federation."

**3.** Shell's `remotes:` gains the third line:

```ts
worklist: 'worklist@http://localhost:3103/mf-manifest.json',
```

**4.** `apps/shell/src/pages/dashboard.tsx`:

```tsx
const WorklistWidget = lazy(() => import('worklist/WorklistWidget'));
```

…rendered under the metrics grid:

```tsx
<Suspense fallback={<p className="text-muted-foreground">Loading worklist…</p>}>
  <WorklistWidget />
</Suspense>
```

Restart shell → dashboard shows the denials table under the tiles.

## 3:30–4:30 · The observation that sets up video 4

**Screen:** :3100 dashboard, cursor circling the worklist next to the uikit tiles.

**Say:** "Notice anything? The tiles are design-system pretty. The worklist is… plain.
Raw text statuses, `toFixed` money. The worklist team never adopted uikit — standalone,
who cares; on the platform dashboard, everyone cares. In the old world they'd npm-install
the design system and redeploy forever after. Next video they'll do something better:
consume uikit over federation — while the shell is consuming *them*."

## 4:30–5:30 · Verify + out

**Checklist (pause here):** dashboard shows the worklist below the tiles · :3103
standalone unchanged · network tab: :3103's manifest + chunks load on the dashboard ·
all three remotes healthy in one page.

**Say:** "One page is now composed from four codebases. And if you paused and did this
one yourself — that's the whole skill. `diff` against `docs/workshop/solutions/step-3/`
or `make catchup step=3`. Next: federation as a *graph*."

---

## Production notes

- Keep total runtime tight — this episode's brevity is a feature ("the pattern fits in
  five minutes now").
- The pause-and-try prompt at 0:20 is the most important line in the episode; deliver
  it as a dare, not a suggestion.
- Pitfall: forgetting the worklist dev-server restart (third time's the charm — viewers
  have seen the error twice; let it happen once on purpose if it happens, and name it).
