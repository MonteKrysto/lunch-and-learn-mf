# Step 3 — A widget remote

**Start from:** your step-2 state · **Ends at:** the state tagged `step-3`
**Solution files:** [`solutions/step-3/`](solutions/step-3/)

## Goal

The worklist team's widget lands on the shell dashboard. Deliberately short — the
mechanics are step 1's, at widget scale. The pattern generalizes: page-sized or
widget-sized, same three config blocks.

## Do it

**1. worklist installs the plugin:**

```bash
pnpm --filter worklist add -D @module-federation/rsbuild-plugin
```

**2. worklist becomes a remote** — `apps/worklist/rsbuild.config.ts`:

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

**3. shell adds the third remote** — `apps/shell/rsbuild.config.ts`:

```ts
remotes: {
  uikit: 'uikit@http://localhost:3101/mf-manifest.json',
  claims: 'claims@http://localhost:3102/mf-manifest.json',
  worklist: 'worklist@http://localhost:3103/mf-manifest.json',
},
```

**4. Drop it on the dashboard** — `apps/shell/src/pages/dashboard.tsx`:

```tsx
import { lazy, Suspense } from 'react';

const WorklistWidget = lazy(() => import('worklist/WorklistWidget'));
```

…and below the metrics grid, inside the page's outer `<div className="space-y-6 p-6">`:

```tsx
<Suspense fallback={<p className="text-muted-foreground">Loading worklist…</p>}>
  <WorklistWidget />
</Suspense>
```

## Verify

Restart `pnpm dev`. The dashboard shows the denials table under the KPI tiles;
:3103 still works standalone. Notice the widget looks plain next to uikit-styled
tiles — that's on purpose. Step 4 fixes it the federated way.

**Stuck?** `diff` against [`solutions/step-3/`](solutions/step-3/).
