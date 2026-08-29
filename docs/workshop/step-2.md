# Step 2 — A whole app as a remote

**Start from:** your step-1 state · **Ends at:** the state tagged `step-2`
**Solution files:** [`solutions/step-2/`](solutions/step-2/)

## Goal

The claims team's entire application — routing, data layer and all — mounts inside
the shell at `/claims/*`, while still running standalone on :3102. One exposed
module, one prop.

## Do it

**1. claims installs the plugin:**

```bash
pnpm --filter claims add -D @module-federation/rsbuild-plugin
```

**2. claims becomes a remote** — `apps/claims/rsbuild.config.ts`, same pattern as
uikit but exposing exactly one module:

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

…plus the remote's self-knowledge at top level:

```ts
server: { port: 3102, cors: true },
dev: { assetPrefix: 'http://localhost:3102' },
output: { assetPrefix: 'http://localhost:3102' },
```

Note what you did **not** touch: `ClaimsApp.tsx` already takes `{ basename = '/' }`
and `bootstrap.tsx` already renders it standalone. The app was built to be
mountable; federation just publishes it.

**3. shell adds the second remote** — in `apps/shell/rsbuild.config.ts`:

```ts
remotes: {
  uikit: 'uikit@http://localhost:3101/mf-manifest.json',
  claims: 'claims@http://localhost:3102/mf-manifest.json',
},
```

**4. Mount it** — `apps/shell/src/router.tsx` replaces the placeholder route
(delete `apps/shell/src/pages/claims-placeholder.tsx`):

```tsx
import { lazy, Suspense } from 'react';

const ClaimsApp = lazy(() => import('claims/ClaimsApp'));

// in the children array, replacing the placeholder route:
{
  path: 'claims/*',
  element: (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading claims app…</p>}>
      <ClaimsApp basename="/claims" />
    </Suspense>
  ),
},
```

## Verify

Restart `pnpm dev`, then walk the routing story — this is the point of the step:

- :3100 → Claims in the sidebar → the full claims list renders inside the shell.
- Click a claim: the URL becomes `/claims/CLM-10xx`. Browser back works.
- Paste `http://localhost:3100/claims/CLM-1014` into a new tab — deep link works.
- :3102 still serves the same app standalone at `/`.

## Worth noticing

- The `basename` prop is the entire routing contract: standalone `/`, embedded
  `/claims`. The claims team's routes (`/` list, `/:claimId` detail) never change.
- `lazy()` matters here in a way it didn't for uikit: the whole claims bundle
  loads only when someone visits `/claims/*`.

**Stuck?** `diff` against [`solutions/step-2/`](solutions/step-2/).
