# Step 5 — Sharing state across apps

**Start from:** your step-4 state · **Ends at:** the state tagged `step-5` (= the `final` branch)
**Solution files:** [`solutions/step-5/`](solutions/step-5/)

## Goal

The worklist widget stops owning a QueryClient and rides the shell's instead —
one cache across two apps. The mechanism: a singleton-shared library means one
module instance, which means **one React context**, which means the remote's
`useQuery` finds the host's provider.

## Do it

**1. Make react-query a shared singleton in BOTH hosts of the pair** — add to the
`shared` block in `apps/shell/rsbuild.config.ts` **and** `apps/worklist/rsbuild.config.ts`:

```ts
shared: {
  react: { singleton: true },
  'react-dom': { singleton: true },
  '@tanstack/react-query': { singleton: true },
},
```

**2. The widget stops providing** — `apps/worklist/src/WorklistWidget.tsx`: remove
`QueryClient`/`QueryClientProvider` (keep `useQuery`), and the default export
becomes provider-less:

```tsx
export default function WorklistWidget() {
  // Embedded: rides the host's QueryClient. Standalone: bootstrap provides one.
  return <WorklistTable />;
}
```

**3. Standalone still needs a client** — `apps/worklist/src/bootstrap.tsx` wraps
the widget itself:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
// …wrap <WorklistWidget /> in <QueryClientProvider client={queryClient}>
```

**4. Visual proof — query devtools in the shell:**

```bash
pnpm --filter shell add @tanstack/react-query-devtools
```

In `apps/shell/src/bootstrap.tsx`, inside the provider next to `<RouterProvider>`:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// …
<ReactQueryDevtools initialIsOpen={false} />
```

## Verify

Restart `pnpm dev`, open :3100, click the devtools flower in the corner: **both**
`['metrics']` (shell code) and `['denials']` (worklist code) sit in ONE cache.
:3103 standalone still works via its bootstrap provider.

## Worth noticing

- claims keeps its own QueryClient **on purpose** — a full app owning its data
  lifecycle is a legitimate choice. Sharing is a decision per remote, not a rule.
- This pattern (singleton lib + provider from host) is how any context-based
  library crosses federation: router contexts, theme providers, i18n.

## The finale

You've built everything. Now watch it deploy like four independent teams:

```bash
make up                    # stop pnpm dev first
make deploy app=claims     # one team ships — keep :3100 open while it runs
```

**Stuck?** `diff` against [`solutions/step-5/`](solutions/step-5/).
