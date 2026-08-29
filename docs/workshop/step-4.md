# Step 4 — A remote becomes a host

**Start from:** your step-3 state · **Ends at:** the state tagged `step-4`
**Solution files:** [`solutions/step-4/`](solutions/step-4/)

## Goal

The worklist adopts the design system — by consuming uikit's components over
federation **while the shell is still consuming the worklist**. Host and remote
aren't roles an app *is*; they're roles an app *plays*. Federation is a graph:

```
shell ──consumes──▶ worklist ──consumes──▶ uikit
  └────────────consumes──────────────────▶ uikit
```

## Do it

**1. worklist gains its own `remotes`** — in `apps/worklist/rsbuild.config.ts`,
add to the existing `pluginModuleFederation` options (keep `name`/`exposes`/`shared`
exactly as they are):

```ts
remotes: {
  uikit: 'uikit@http://localhost:3101/mf-manifest.json',
},
```

**2. Federated types for worklist** — `apps/worklist/tsconfig.json`,
`compilerOptions`:

```json
"paths": { "*": ["./@mf-types/*"] }
```

**3. Adopt the design system** — in `apps/worklist/src/WorklistWidget.tsx`, import
the uikit components:

```tsx
import ClaimStatusBadge from 'uikit/ClaimStatusBadge';
import AgingBadge from 'uikit/AgingBadge';
import CurrencyText from 'uikit/CurrencyText';
```

…and in the table rows, replace the three plain cells:

```tsx
<td className="py-1.5 pr-3"><CurrencyText amount={d.amount} /></td>       {/* was ${d.amount.toFixed(2)} */}
<td className="py-1.5 pr-3"><AgingBadge days={d.agingDays} /></td>       {/* was {d.agingDays} days */}
<td className="py-1.5"><ClaimStatusBadge status={d.status} /></td>       {/* was raw text */}
```

## Verify

Restart `pnpm dev`:

- Dashboard worklist now shows uikit badges and currency formatting — and so does
  :3103 standalone. One adoption, both surfaces.
- Network tab on :3100: uikit's chunks load **once**, even though both the shell
  and the worklist reference them. Shared modules resolve per page, not per app.
- Typecheck still passes: `d.status` is the literal `'denied'`, assignable to
  `ClaimStatusBadge`'s status union. Contracts, not casts.

## Worth noticing

Nothing about the worklist's *remote* side changed — the shell never knew this
happened. The uikit team just gained a consumer they may not know about either.
That's the power and the governance question, in one step.

**Stuck?** `diff` against [`solutions/step-4/`](solutions/step-4/).
