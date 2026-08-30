# Video 5 — Sharing State Across Apps (8–10 min)

**Teaches:** how state crosses a federation boundary — a singleton-shared library means
one module instance, one React context, so a remote can ride the host's provider.
**Starts from:** end of video 4 (the state tagged `step-4`).
**Ends at:** the state tagged `step-5` = the finished build (guide: `docs/workshop/step-5.md`).

## Pre-flight

- [ ] State = end of step 4 (`make catchup step=4`), `pnpm dev` running
- [ ] Browser tab: :3100 (dashboard)
- [ ] Editor tabs: both `rsbuild.config.ts` (shell, worklist), `apps/worklist/src/WorklistWidget.tsx`, `apps/worklist/src/bootstrap.tsx`, `apps/shell/src/bootstrap.tsx`

---

## 0:00–0:50 · Cold open — the invisible seam

**Screen:** :3100 dashboard.

**Say:** "This page looks unified, but there's a seam you can't see: the shell fetches
metrics with *its* QueryClient; the worklist fetches denials with *its own*, buried
inside the widget. Two caches, two retry policies, no coordination — and if both ever
fetched the same endpoint, they'd fetch it twice. Today: one QueryClient spanning both
apps. And the mechanism is the most transferable idea in this series."

**Recovery line:** "Joining here? `make catchup step=4`."

## 0:50–2:10 · The mechanism, before the code

**Screen:** a terminal or the deck — 30 seconds of theory, it earns its keep:

**Say:** "React context works by module identity — a provider and a consumer must
import the *same copy* of the library, or the consumer sees nothing. Across federation,
each app normally bundles its own copy: same version, different instance, invisible
providers. `shared … singleton: true` collapses them to ONE instance — one context —
so a provider mounted by the shell is visible to a hook running in the worklist. That's
the whole trick: **share the library, and context flows across apps for free.**"

## 2:10–3:20 · Share the library

**Screen:** both rsbuild configs — add the third singleton to `shared` in
`apps/shell/rsbuild.config.ts` **and** `apps/worklist/rsbuild.config.ts`:

```ts
shared: {
  react: { singleton: true },
  'react-dom': { singleton: true },
  '@tanstack/react-query': { singleton: true },
},
```

**Say:** "Both sides of the boundary, same as react itself. Claims is deliberately NOT
in this club — hold that thought."

## 3:20–5:00 · Move the provider to the edge

**Screen:** `apps/worklist/src/WorklistWidget.tsx` — delete the provider from the
widget; the export becomes:

```tsx
export default function WorklistWidget() {
  // Embedded: rides the host's QueryClient. Standalone: bootstrap provides one.
  return <WorklistTable />;
}
```

**Say:** "The widget now *assumes* someone above it provides a client. Embedded, that's
the shell. Standalone —" **switch to `apps/worklist/src/bootstrap.tsx`** "— it's our own
bootstrap:"

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
// wrap <WorklistWidget /> in <QueryClientProvider client={queryClient}>
```

**Say:** "This is a real pattern with a name worth remembering: **providers live at the
composition edge, not inside shared components.** The component states its needs; each
mount point supplies them."

## 5:00–6:30 · Visual proof — one cache

**Terminal:** `pnpm --filter shell add @tanstack/react-query-devtools`

**Screen:** `apps/shell/src/bootstrap.tsx` — render `<ReactQueryDevtools
initialIsOpen={false} />` inside the provider, next to the RouterProvider.

**Do:** restart both dev servers → :3100 → open the devtools flower.

**The moment:** "`['metrics']` — that query runs in shell code. `['denials']` — that
one runs in *worklist* code. Same list, same cache, one client. The worklist's data is
now visible to the platform's tooling — and if the shell ever prefetches denials, the
widget gets it for free."

**Also show:** :3103 standalone still works — bootstrap's provider in action.

## 6:30–8:00 · The judgment call, verify, out

**Say:** "Now — why is claims not shared? Deliberate. A full application owning its
data lifecycle is a legitimate architecture; a widget riding its host is a different
legitimate architecture. **Sharing state couples teams** — the shell's react-query
version, cache config, and upgrade schedule now bind the worklist. Do it when the
integration is worth the coupling, per remote, not as a reflex. And this pattern is
bigger than react-query: theme providers, i18n, auth context — any context-based
library crosses federation exactly this way: singleton + provider at the edge."

**Verify checklist (pause):** devtools shows `['metrics']` AND `['denials']` in one
cache · :3103 standalone still renders · claims detail pages still work (their own
client, untouched).

**Stuck?** "`docs/workshop/solutions/step-5/` or `make catchup step=5`."

**Tease:** "That's the last line of code in the series. You've built the whole thing —
but you've only ever run it on dev servers. The finale is the payoff: five containers,
independent deploys, and one team shipping to production without asking anyone."

---

## Production notes

- The 0:50 theory beat is the one to rehearse — module identity → context identity is
  THE transferable insight; if it lands, everything else in the episode is obvious.
- Pitfall: forgetting to restart BOTH dev servers after the shared-config change — the
  singleton negotiation happens at page compose time; a stale worklist still bundles
  its own react-query and the devtools will quietly show only `['metrics']`.
- Pitfall: devtools button not visible — it's dev-only by design; also say so here,
  because in video 6's docker build it will disappear and viewers will ask.
