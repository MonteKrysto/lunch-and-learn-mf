# Step 1 — Hello federation

**Start from:** a fresh clone (zero federation) · **Ends at:** the state tagged `step-1`
**Solution files:** [`solutions/step-1/`](solutions/step-1/)

## Goal

The uikit team exposes four components over module federation; the shell consumes
them, replacing its homegrown `KpiTile` with uikit's `MetricCard`. Two apps, still
deployed separately, now sharing living code at runtime.

## Do it

**1. Both teams install the federation plugin** (each app owns its own deps):

```bash
pnpm --filter uikit add -D @module-federation/rsbuild-plugin
pnpm --filter shell add -D @module-federation/rsbuild-plugin
```

**2. uikit becomes a remote** — `apps/uikit/rsbuild.config.ts` gains the plugin:

```ts
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

// inside plugins: [...]
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

…and, at the config's top level, the remote must know its own public URL and allow
cross-origin loading:

```ts
server: { port: 3101, cors: true },
dev: { assetPrefix: 'http://localhost:3101' },
output: { assetPrefix: 'http://localhost:3101' },
```

**3. shell becomes a host** — `apps/shell/rsbuild.config.ts`:

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

**4. Federated TypeScript types** — in `apps/shell/tsconfig.json`, add to
`compilerOptions` (types are fetched from the running remote into a gitignored
`@mf-types/` folder):

```json
"paths": { "*": ["./@mf-types/*"] }
```

**5. Consume it** — in `apps/shell/src/pages/dashboard.tsx`, swap the local tile
for the federated one, then delete `apps/shell/src/components/kpi-tile.tsx`:

```tsx
import MetricCard from 'uikit/MetricCard';   // was: { KpiTile } from '../components/kpi-tile'
```

> ⚠️ Note the **default** import — `import MetricCard from …`, not
> `import { MetricCard } from …`. KpiTile was a named export; the exposed uikit
> components are default exports. The named form fails with "no exported member".

(usage is a rename: `<KpiTile …>` → `<MetricCard …>` — same props.)

## Verify

Restart `pnpm dev`. The dashboard's KPI tiles now render uikit's `MetricCard` —
same data, uikit's card styling. Then prove it's real:

- Network tab, filter `uikit`: `mf-manifest.json` → `uikit.js` (the remote entry) →
  `__federation_expose_MetricCard.js`.
- Kill the uikit dev server, reload :3100 — federation error. A remote is a
  runtime dependency. Restart it.
- Hover `uikit/MetricCard` in your editor: autocomplete from another app's types.
  (Red squiggles? Run `pnpm dev` once, then restart your editor's TS server.)

## Worth noticing

- `singleton: true` on react/react-dom is the #1 real-world footgun. Try removing
  `shared` from both configs (restart both): the page still works, but the network tab
  shows TWO `lib-react.js` loads — one per origin. It works only because uikit's
  components have no hooks yet; add a `useState` to MetricCard and it explodes with an
  invalid-hook error. Two Reacts is a time bomb, not a grenade. Put `shared` back.
- What you "killed" above was a file server. Run `pnpm --filter uikit build` and
  look at `apps/uikit/dist/` — that folder is the entire deployable: static files,
  no server process. In production a remote lives on a CDN and runs only in the
  browser; a dead remote is a CDN outage, not a crashed app.
- Exposed components each `import '../index.css'` (already there since `start`):
  an exposed module must own its styles — the host won't build your CSS for you.

**Stuck?** `diff` your files against [`solutions/step-1/`](solutions/step-1/).
