# Video 8 — Bonus: When a Remote Is Down (8–10 min)

**Teaches:** owning the failure mode federation gives you — error boundaries per remote
slot plus the `errorLoadRemote` runtime hook, so a dead remote degrades to a placeholder
instead of blanking the host.
**Starts from:** end of step 6 (`make catchup step=6`) — uses store mode for the kill demo.
**Ends at:** the state tagged `step-7` (workshop guide: `docs/workshop/step-7.md`).

## Pre-flight

- [ ] State = end of step 6; `pnpm dev` stopped
- [ ] Terminals: store, commands; editor on `apps/shell/src/router.tsx`
- [ ] Have the step-7 solution files handy — the plugin gets pasted, not typed

---

## 0:00–1:00 · Cold open — show the crash first

**Do before explaining anything:** store mode up (`make store`, publish all three,
`make host`), page healthy at :3100. Then, on camera:

```bash
rm -rf .artifact-store/uikit
```

Reload → **blank page**. Let it sit for a beat.

**Say:** "One team's CDN folder went missing, and the entire product is gone. Every
episode we said 'a remote is a runtime dependency' — this is the bill for that. Today
we make failure *local*: same outage, but only uikit's slots go dark. Two layers,
about thirty lines."

**Recovery line:** "Joining here? `make catchup step=6`, stop `pnpm dev`."

## 1:00–2:00 · Why it crashes — two failure surfaces

**Say over the console errors:** "Two different things died just now. First, the
federation runtime fetches every remote's manifest at boot — that fetch failed and
took boot down with it. Second, even past boot, a remote that fails to load rejects
inside React's tree, and without a boundary React unmounts *everything*. Network
layer, render layer. Two layers of failure, so: two layers of defense."

## 2:00–4:00 · Layer one — the boundary

**Screen:** create `src/components/remote-boundary.tsx` — type the skeleton, narrate
the two members that matter (`getDerivedStateFromError`, the fallback card), paste the
styling. Then wrap both slots:

- `router.tsx`: `<RemoteBoundary name="claims">` around the claims Suspense
- `dashboard.tsx`: `<RemoteBoundary name="denials worklist">` around the worklist

**Say:** "Rule of thumb: **every place a remote enters your tree is a place you own a
boundary.** Suspense answers 'what shows while it loads' — the boundary answers 'what
shows if it never does'."

## 4:00–6:00 · Layer two — the runtime plugin

**Screen:** create `src/mf-fallback.ts` — paste it (it's in
`docs/workshop/solutions/step-7/`), then walk the two cases slowly:

- `'afterResolve'` — "the manifest fetch failed. We hand the runtime a *stub*
  manifest — right shape, remoteEntry pointing nowhere — so boot survives. The
  individual modules then fail into…"
- `'onLoad'` — "…this: return a factory for a placeholder component. Note the inline
  styles — this component must render even when nothing else arrived. And note we
  import React lazily inside the hook: it's a shared singleton; never race it."

**Register it** in `rsbuild.config.ts`:

```ts
runtimePlugins: ['./src/mf-fallback.ts'],
```

**Say:** "This hook is the MF runtime's official extension point for exactly this —
same place you'd add retries, circuit breakers, or telemetry for remote loads."

## 6:00–8:00 · THE moment — same outage, different day

**Do:** rebuild + serve (`make host` again — cut the build), uikit still missing from
the store. Reload :3100.

**Walk the screenshot-worthy state:**

- Page boots: nav, headers, data all alive.
- Four KPI slots: *"uikit/MetricCard" is unavailable right now* — "that's the plugin."
- Worklist slot: the boundary card — "worklist *loaded* — it's the worklist's own
  uikit imports that crashed its render, and our boundary contained it. Two layers,
  both visibly earning their keep on one screen."
- Click Claims → fully working. "One team's outage stayed one team's outage."

**Heal it:** `make publish app=uikit` → reload → whole again.

## 8:00–9:30 · Wrap — the ownership rule

**Say:** "The rule this episode leaves you with: **every consumer owns its own
resilience.** The shell's plugin covers the shell's imports — you saw the worklist's
uikit failure fall back to the shell's *boundary*, because the worklist has no plugin
of its own. Adding one is your exercise; the pattern is identical. And two honest
footnotes: boundaries don't retry — React caches the failed load, so pair this with a
retry plugin or a reload affordance in real life. And placeholders are a floor, not a
UX strategy — decide per slot what 'degraded' should actually look like for your
product. That's the last lesson of the series: federation hands you independence, and
resilience is the tax you pay for it — about thirty lines, once you know where they go."

---

## Production notes

- The cold open MUST show the crash before any explanation — the blank page is the
  motivation for everything after.
- Console errors during the crash beat are ugly; zoom the browser viewport, not the
  devtools, and let the [mf] warnings from the plugin show in the healed run — they're
  the observability story.
- If the placeholder tiles don't appear after adding the plugin: stale shell build —
  `make host` rebuilds it; the plugin is baked into the shell bundle.
- Revert nothing at the end — this state IS step-7 (`git diff step-7` to self-verify).
