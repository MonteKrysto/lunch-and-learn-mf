# Video 4 — A Remote Becomes a Host (8–10 min)

**Teaches:** host and remote are roles, not identities — federation is a graph. The
worklist consumes uikit while the shell consumes the worklist.
**Starts from:** end of video 3 (the state tagged `step-3`).
**Ends at:** the state tagged `step-4` (workshop guide: `docs/workshop/step-4.md`).

## Pre-flight

- [ ] State = end of step 3 (`make catchup step=3`), `pnpm dev` running
- [ ] Browser tabs: :3100 (dashboard — plain worklist under pretty tiles), :3103
- [ ] Editor tabs: `apps/worklist/rsbuild.config.ts`, `apps/worklist/src/WorklistWidget.tsx`, `apps/worklist/tsconfig.json`
- [ ] Network tab docked and cleared

---

## 0:00–0:45 · Cold open — the eyesore and the reveal

**Screen:** :3100 dashboard; zoom on the plain worklist beside the uikit tiles.

**Say:** "The worklist team wants the design system. Old world: npm install, version
bumps forever. Our world: uikit is already federated — so the worklist will *consume* it.
Wait — the worklist is a remote. Can a remote consume remotes? Here's the reveal this
whole series has been building to: **host and remote aren't things an app is. They're
things an app does.** Both, if it wants."

**Recovery line:** "Joining here? `make catchup step=3`."

## 0:45–2:30 · The worklist grows a `remotes` block

**Screen:** `apps/worklist/rsbuild.config.ts`. **Add to the existing federation options —
emphasize you're adding, not replacing:**

```ts
remotes: {
  uikit: 'uikit@http://localhost:3101/mf-manifest.json',
},
```

**Say:** "Look at this config now: `name`, `exposes`, `shared` — the remote's side.
`remotes` — the host's side. Same app, same config, both roles. This file is the thesis
of the episode."

**Then** `apps/worklist/tsconfig.json` — the types line, same as the shell's in video 1:

```json
"paths": { "*": ["./@mf-types/*"] }
```

## 2:30–4:30 · Adopt the design system

**Screen:** `apps/worklist/src/WorklistWidget.tsx`. **Type the imports:**

```tsx
import ClaimStatusBadge from 'uikit/ClaimStatusBadge';
import AgingBadge from 'uikit/AgingBadge';
import CurrencyText from 'uikit/CurrencyText';
```

**Swap the three plain cells** (paste, then walk them):

```tsx
<td className="py-1.5 pr-3"><CurrencyText amount={d.amount} /></td>
<td className="py-1.5 pr-3"><AgingBadge days={d.agingDays} /></td>
<td className="py-1.5"><ClaimStatusBadge status={d.status} /></td>
```

**Say:** "`toFixed` becomes CurrencyText. Raw day counts become aging buckets. Text
becomes a status badge. The worklist team didn't install anything — they're rendering
the design-system team's *running code*."

**Do:** restart worklist dev → reload :3100.

## 4:30–6:00 · The moment, twice

1. **Dashboard:** the worklist now matches the tiles — badges, buckets, currency.
2. **Switch to :3103:** the standalone worklist got the same upgrade. **Say:** "One
   adoption, both surfaces. Standalone, the worklist is a host pulling uikit. Embedded,
   it's a remote *and* a host at once. The graph: shell → worklist → uikit, and
   shell → uikit directly. That's not a tree — it's a graph, and it's fine."

## 6:00–7:30 · Two proofs for the skeptics

- **Chunks load once.** Network tab on :3100, filter `3101`: uikit's react vendor and
  component chunks appear **once**, even though shell and worklist both consume them.
  "Shared modules resolve per *page*, not per consumer. Three apps, one React, one
  MetricCard chunk."
- **Contracts, not casts.** Hover `status={d.status}` — the worklist's literal type
  `'denied'` satisfies `ClaimStatusBadge`'s status union, checked against types fetched
  from the running uikit. "If uikit renames a variant tomorrow, this typecheck fails
  here. Runtime composition with compile-time guardrails."

## 7:30–9:00 · The governance beat, verify, out

**Say:** "Notice what *didn't* change: the worklist's `exposes`. The shell has no idea
any of this happened. And here's the flip side worth saying out loud: the uikit team
just gained a consumer they may not know about. In a real org, that's why you keep a
registry of who consumes what, and why exposed surfaces stay small and stable — every
expose is a contract someone will lean on."

**Verify checklist (pause):** dashboard worklist uses uikit badges · :3103 shows the
same · uikit chunks appear once in the network tab · typecheck passes.

**Stuck?** "`docs/workshop/solutions/step-4/` or `make catchup step=4`."

**Tease:** "Last building block: right now the shell and the worklist each fetch their
own data with separate caches. Next video, one QueryClient spans both apps — state
across a federation boundary."

---

## Production notes

- The 0:45 config shot (one file showing `exposes` AND `remotes`) is the episode's
  thumbnail-worthy frame; linger on it.
- Cutaway option at 4:30: the "One App, Many Teams" deck, Part 2's federation-graph step.
- Pitfall: `@mf-types` reds in the editor after adding the imports — the standing fix
  ("dev server running, restart TS server") is worth repeating on camera here because
  this is the first time the *worklist* fetches types.
