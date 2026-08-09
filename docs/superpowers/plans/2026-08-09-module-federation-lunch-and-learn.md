# Module Federation Lunch & Learn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a turborepo monorepo with four Rsbuild React apps + one Express API that teaches module federation via a step-tagged code-along (standalone apps on a `start` branch, federation added in tagged steps on `main`).

**Architecture:** Host shell (:3100) consumes three remotes — uikit components (:3101), a full claims app (:3102), and a denials worklist widget (:3103) that later becomes a host+remote by consuming uikit. One Express API (:4100) serves all apps. No shared workspace packages; every app is self-contained. Federation uses Module Federation v2 via `@module-federation/rsbuild-plugin` (Rspack under the hood) with federated TypeScript types.

**Tech Stack:** Rsbuild + Rspack, `@module-federation/rsbuild-plugin`, React 19, react-router v8 (library mode), TanStack Query v5, Tailwind CSS v4 (`@rsbuild/plugin-tailwindcss`), shadcn-style components (cva + radix slot), Express 5 + TypeScript (tsx runtime), pnpm workspaces, turborepo, docker-compose with nginx.

**Spec:** `docs/superpowers/specs/2026-08-09-module-federation-lunch-and-learn-design.md`

## Global Constraints

- **No shared workspace packages.** Nothing in `packages/`. Each app duplicates its own tailwind setup, ui components, types, api client. Every app `package.json` must work if the app dir were extracted to its own repo.
- **Ports are fixed and identical in dev and docker:** shell 3100, uikit 3101, claims 3102, worklist 3103, claims-api 4100.
- **No test suites.** Verification bar per task: `pnpm typecheck` and `pnpm build` green (plus curl checks for the API).
- **No SSR.** All apps are CSR SPAs.
- **react-router in library mode only** (`createBrowserRouter` / `RouterProvider` imported from `react-router`). Never the framework-mode plugin.
- **Shared singletons:** `react` and `react-dom` in every federated app; `@tanstack/react-query` added as a singleton only in step 5 (shell + worklist only).
- **Relative imports only** inside apps (no `@/` path aliases) — keeps tsconfig/rsbuild alias plumbing out of the lesson.
- **API base URL is hardcoded** `http://localhost:4100` in each app's `lib/api.ts` (identical dev/docker ports make this correct in both modes).
- Git identity: commits on `main`; the `start` branch and `step-1`…`step-5` tags are created exactly where tasks say.
- All commits end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## Branch/tag map (what the audience sees)

| Ref | State |
|---|---|
| `start` branch | All 5 services working standalone. Zero federation. Attendees start here. |
| `step-1` tag | uikit exposes components; shell consumes them |
| `step-2` tag | claims app exposed + mounted at `/claims/*` in shell |
| `step-3` tag | worklist widget exposed + on shell dashboard |
| `step-4` tag | worklist ALSO consumes uikit (host+remote) |
| `step-5` tag / `main` | shared QueryClient singleton (shell+worklist) + query devtools |

---

### Task 1: Wipe scaffold, create monorepo skeleton

**Files:**
- Delete: `app/`, `public/`, `Dockerfile`, `.dockerignore`, `react-router.config.ts`, `vite.config.ts`, `tsconfig.json`, `package.json`, `pnpm-lock.yaml`, `README.md`, `node_modules/`
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`

**Interfaces:**
- Produces: workspace globs `apps/*` and `services/*`; root scripts `pnpm dev|build|typecheck` running turbo; turbo tasks named exactly `dev`, `build`, `typecheck` (every app in later tasks must define these three scripts).

- [ ] **Step 1: Delete the create-react-router scaffold**

```bash
cd /Users/cthaeh/projects/lunch-and-learn-mfe
git rm -r app public react-router.config.ts vite.config.ts tsconfig.json package.json README.md Dockerfile .dockerignore
git rm --cached pnpm-lock.yaml 2>/dev/null; rm -f pnpm-lock.yaml
rm -rf node_modules
```

- [ ] **Step 2: Write root `package.json`**

```json
{
  "name": "lunch-and-learn-mfe",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {}
}
```

- [ ] **Step 3: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'services/*'
```

- [ ] **Step 4: Write `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "outputs": ["dist/**"] },
    "typecheck": {}
  }
}
```

- [ ] **Step 5: Write `.gitignore`**

```
node_modules/
dist/
.turbo/
@mf-types/
*.log
.DS_Store
```

- [ ] **Step 6: Pin pnpm + install turbo**

```bash
corepack use pnpm@latest-10   # writes "packageManager" into root package.json
pnpm add -D -w turbo
```

- [ ] **Step 7: Verify turbo runs**

Run: `pnpm build`
Expected: turbo runs, "No tasks were executed" (no packages yet) — exit 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: replace scaffold with turborepo monorepo skeleton"
```

---

### Task 2: `apps/claims/api` — Express API with seeded RCM data

**Files:**
- Create: `apps/claims/api/package.json`, `apps/claims/api/tsconfig.json`, `apps/claims/api/src/types.ts`, `apps/claims/api/src/data.ts`, `apps/claims/api/src/index.ts`

**Interfaces:**
- Produces (consumed by every frontend via HTTP):
  - `GET /health` → `{ ok: true }`
  - `GET /api/claims?status=<s>&payer=<p>` → `Claim[]` (both query params optional)
  - `GET /api/claims/:id` → `Claim` or 404 `{ error: string }`
  - `GET /api/denials` → `Claim[]` (status === 'denied', sorted by amount desc)
  - `GET /api/metrics` → `{ arDays: number, cleanClaimRate: number, totalDeniedAmount: number, openClaims: number }`
  - `Claim` shape: `{ id: string ("CLM-1001"…), patientName: string, payer: string, amount: number (dollars), status: 'submitted'|'paid'|'denied'|'appealed', serviceDate: string (ISO date), agingDays: number, denialReason?: { code: string, description: string }, history: { date: string, status: string, note: string }[] }`

- [ ] **Step 1: Scaffold package**

```bash
mkdir -p apps/claims/api/src && cd apps/claims/api
```

`apps/claims/api/package.json`:

```json
{
  "name": "claims-api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "build": "tsc --noEmit",
    "typecheck": "tsc --noEmit"
  }
}
```

(`build` is a typecheck alias so `turbo build` covers this package too.)

```bash
pnpm add express cors
pnpm add -D typescript tsx @types/express @types/cors @types/node
```

- [ ] **Step 2: Write `apps/claims/api/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write `apps/claims/api/src/types.ts`**

```ts
export type ClaimStatus = 'submitted' | 'paid' | 'denied' | 'appealed';

export interface DenialReason {
  code: string;
  description: string;
}

export interface ClaimEvent {
  date: string;
  status: string;
  note: string;
}

export interface Claim {
  id: string;
  patientName: string;
  payer: string;
  amount: number;
  status: ClaimStatus;
  serviceDate: string;
  agingDays: number;
  denialReason?: DenialReason;
  history: ClaimEvent[];
}
```

- [ ] **Step 4: Write `apps/claims/api/src/data.ts` (deterministic seed, ~50 claims)**

```ts
import type { Claim, ClaimStatus, DenialReason } from './types.js';

// Deterministic PRNG so every clone sees identical data.
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260809);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

const PAYERS = ['Aetna', 'UnitedHealthcare', 'Cigna', 'BCBS of TX', 'Humana', 'Medicare'];
const FIRST = ['Maria', 'James', 'Wei', 'Aisha', 'Carlos', 'Emily', 'Raj', 'Sofia', 'Tyrone', 'Hannah'];
const LAST = ['Garcia', 'Okafor', 'Chen', 'Patel', 'Johnson', 'Nguyen', 'Smith', 'Kowalski', 'Reyes', 'Kim'];

const DENIAL_REASONS: DenialReason[] = [
  { code: 'CO-45', description: 'Charge exceeds fee schedule' },
  { code: 'CO-97', description: 'Service included in another procedure' },
  { code: 'CO-16', description: 'Claim lacks required information' },
  { code: 'CO-29', description: 'Timely filing limit expired' },
  { code: 'PR-1', description: 'Deductible amount' },
  { code: 'CO-11', description: 'Diagnosis inconsistent with procedure' },
];

// Weighted status distribution: enough denials to make the worklist interesting.
const STATUS_POOL: ClaimStatus[] = [
  'submitted', 'submitted', 'submitted',
  'paid', 'paid', 'paid', 'paid',
  'denied', 'denied',
  'appealed',
];

function buildClaim(i: number): Claim {
  const status = pick(STATUS_POOL);
  const agingDays = Math.floor(rand() * 120) + 1;
  const serviceDate = new Date(Date.UTC(2026, 3, 1 + Math.floor(rand() * 90)));
  const amount = Math.round((150 + rand() * 24850) * 100) / 100;
  const patientName = `${pick(FIRST)} ${pick(LAST)}`;
  const submitted = {
    date: serviceDate.toISOString().slice(0, 10),
    status: 'submitted',
    note: 'Claim submitted to payer',
  };
  const claim: Claim = {
    id: `CLM-${1001 + i}`,
    patientName,
    payer: pick(PAYERS),
    amount,
    status,
    serviceDate: serviceDate.toISOString().slice(0, 10),
    agingDays,
    history: [submitted],
  };
  if (status === 'denied' || status === 'appealed') {
    claim.denialReason = pick(DENIAL_REASONS);
    claim.history.push({
      date: serviceDate.toISOString().slice(0, 10),
      status: 'denied',
      note: `Denied: ${claim.denialReason.code} — ${claim.denialReason.description}`,
    });
  }
  if (status === 'appealed') {
    claim.history.push({
      date: serviceDate.toISOString().slice(0, 10),
      status: 'appealed',
      note: 'Appeal filed with supporting documentation',
    });
  }
  if (status === 'paid') {
    claim.history.push({
      date: serviceDate.toISOString().slice(0, 10),
      status: 'paid',
      note: 'Payment posted',
    });
  }
  return claim;
}

export const claims: Claim[] = Array.from({ length: 50 }, (_, i) => buildClaim(i));
```

- [ ] **Step 5: Write `apps/claims/api/src/index.ts`**

```ts
import express from 'express';
import cors from 'cors';
import { claims } from './data.js';

const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/claims', (req, res) => {
  const { status, payer } = req.query;
  let result = claims;
  if (typeof status === 'string' && status !== 'all') {
    result = result.filter((c) => c.status === status);
  }
  if (typeof payer === 'string' && payer !== 'all') {
    result = result.filter((c) => c.payer === payer);
  }
  res.json(result);
});

app.get('/api/claims/:id', (req, res) => {
  const claim = claims.find((c) => c.id === req.params.id);
  if (!claim) {
    res.status(404).json({ error: `Claim ${req.params.id} not found` });
    return;
  }
  res.json(claim);
});

app.get('/api/denials', (_req, res) => {
  const denials = claims
    .filter((c) => c.status === 'denied')
    .sort((a, b) => b.amount - a.amount);
  res.json(denials);
});

app.get('/api/metrics', (_req, res) => {
  const denied = claims.filter((c) => c.status === 'denied');
  const open = claims.filter((c) => c.status !== 'paid');
  const arDays =
    Math.round((open.reduce((sum, c) => sum + c.agingDays, 0) / Math.max(open.length, 1)) * 10) / 10;
  const cleanClaimRate =
    Math.round(((claims.length - denied.length) / claims.length) * 1000) / 10;
  const totalDeniedAmount = Math.round(denied.reduce((s, c) => s + c.amount, 0) * 100) / 100;
  res.json({ arDays, cleanClaimRate, totalDeniedAmount, openClaims: open.length });
});

const PORT = 4100;
app.listen(PORT, () => {
  console.log(`claims-api listening on http://localhost:${PORT}`);
});
```

- [ ] **Step 6: Verify**

```bash
cd /Users/cthaeh/projects/lunch-and-learn-mfe
pnpm --filter claims-api typecheck
pnpm --filter claims-api dev &   # background
sleep 2
curl -s http://localhost:4100/health
curl -s "http://localhost:4100/api/claims?status=denied" | head -c 300
curl -s http://localhost:4100/api/metrics
curl -s http://localhost:4100/api/claims/CLM-1001 | head -c 300
curl -s -o /dev/null -w "%{http_code}" http://localhost:4100/api/claims/NOPE   # expect 404
kill %1
```

Expected: `{"ok":true}`, JSON arrays/objects, `404` for the missing claim, typecheck exit 0.

- [ ] **Step 7: Commit**

```bash
git add apps/claims/api
git commit -m "feat(claims-api): Express API with deterministic seeded RCM data"
```

---

### Task 3: `apps/uikit` — standalone component gallery (no federation yet)

**Files:**
- Create: `apps/uikit/package.json`, `apps/uikit/tsconfig.json`, `apps/uikit/rsbuild.config.ts`, `apps/uikit/src/index.tsx`, `apps/uikit/src/bootstrap.tsx`, `apps/uikit/src/index.css`, `apps/uikit/src/lib/utils.ts`, `apps/uikit/src/components/ui/badge.tsx`, `apps/uikit/src/components/ui/card.tsx`, `apps/uikit/src/components/claim-status-badge.tsx`, `apps/uikit/src/components/metric-card.tsx`, `apps/uikit/src/components/aging-badge.tsx`, `apps/uikit/src/components/currency-text.tsx`, `apps/uikit/src/gallery.tsx`

**Interfaces:**
- Produces (default exports, federated in Task 9):
  - `ClaimStatusBadge`: props `{ status: 'submitted' | 'paid' | 'denied' | 'appealed' }`
  - `MetricCard`: props `{ label: string; value: string; hint?: string }`
  - `AgingBadge`: props `{ days: number }`
  - `CurrencyText`: props `{ amount: number; className?: string }`

- [ ] **Step 1: Scaffold package + deps**

```bash
mkdir -p apps/uikit/src/components/ui apps/uikit/src/lib && cd apps/uikit
```

`apps/uikit/package.json`:

```json
{
  "name": "uikit",
  "private": true,
  "scripts": {
    "dev": "rsbuild dev",
    "build": "rsbuild build",
    "preview": "rsbuild preview",
    "typecheck": "tsc --noEmit"
  }
}
```

```bash
pnpm add react react-dom clsx tailwind-merge class-variance-authority
pnpm add -D @rsbuild/core @rsbuild/plugin-react @rsbuild/plugin-tailwindcss tailwindcss typescript @types/react @types/react-dom
```

- [ ] **Step 2: Write `apps/uikit/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write `apps/uikit/rsbuild.config.ts`**

```ts
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindCSS } from '@rsbuild/plugin-tailwindcss';

export default defineConfig({
  plugins: [pluginReact(), pluginTailwindCSS()],
  html: { title: 'RCM UI Kit' },
  server: { port: 3101 },
});
```

- [ ] **Step 4: Write entry files**

`apps/uikit/src/index.tsx` (async boundary — harmless standalone, required once federated; every app uses this pattern):

```tsx
// Async boundary: lets the bundler resolve shared/federated deps before app code runs.
import('./bootstrap');
```

`apps/uikit/src/bootstrap.tsx`:

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Gallery } from './gallery';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Gallery />
  </React.StrictMode>,
);
```

- [ ] **Step 5: Write `apps/uikit/src/index.css` (Tailwind v4 + shadcn-style theme — this exact file is duplicated into every app)**

```css
@import 'tailwindcss';

@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.145 0 0);
  --color-primary: oklch(0.205 0 0);
  --color-primary-foreground: oklch(0.985 0 0);
  --color-secondary: oklch(0.97 0 0);
  --color-secondary-foreground: oklch(0.205 0 0);
  --color-muted: oklch(0.97 0 0);
  --color-muted-foreground: oklch(0.556 0 0);
  --color-border: oklch(0.922 0 0);
  --color-destructive: oklch(0.577 0.245 27.325);
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

- [ ] **Step 6: Write `apps/uikit/src/lib/utils.ts` (duplicated into every app that has ui components)**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 7: Write shadcn-style primitives**

`apps/uikit/src/components/ui/badge.tsx`:

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        destructive: 'border-transparent bg-destructive text-white',
        success: 'border-transparent bg-emerald-600 text-white',
        warning: 'border-transparent bg-amber-500 text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

`apps/uikit/src/components/ui/card.tsx`:

```tsx
import * as React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1 p-4 pb-2', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('text-sm font-medium text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('p-4 pt-0', className)} {...props} />;
}
```

- [ ] **Step 8: Write the four RCM components (the federated surface)**

`apps/uikit/src/components/claim-status-badge.tsx`:

```tsx
import { Badge, type BadgeVariant } from './ui/badge';

export type ClaimStatus = 'submitted' | 'paid' | 'denied' | 'appealed';

const STATUS_CONFIG: Record<ClaimStatus, { label: string; variant: BadgeVariant }> = {
  submitted: { label: 'Submitted', variant: 'secondary' },
  paid: { label: 'Paid', variant: 'success' },
  denied: { label: 'Denied', variant: 'destructive' },
  appealed: { label: 'Appealed', variant: 'warning' },
};

export default function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const { label, variant } = STATUS_CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
```

`apps/uikit/src/components/metric-card.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
}

export default function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
```

`apps/uikit/src/components/aging-badge.tsx`:

```tsx
import { Badge, type BadgeVariant } from './ui/badge';

function bucket(days: number): { label: string; variant: BadgeVariant } {
  if (days <= 30) return { label: '0–30', variant: 'secondary' };
  if (days <= 60) return { label: '31–60', variant: 'outline' };
  if (days <= 90) return { label: '61–90', variant: 'warning' };
  return { label: '90+', variant: 'destructive' };
}

export default function AgingBadge({ days }: { days: number }) {
  const { label, variant } = bucket(days);
  return <Badge variant={variant}>{label} days</Badge>;
}
```

`apps/uikit/src/components/currency-text.tsx`:

```tsx
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function CurrencyText({ amount, className }: { amount: number; className?: string }) {
  return <span className={className}>{usd.format(amount)}</span>;
}
```

- [ ] **Step 9: Write `apps/uikit/src/gallery.tsx` (standalone demo page)**

```tsx
import ClaimStatusBadge from './components/claim-status-badge';
import MetricCard from './components/metric-card';
import AgingBadge from './components/aging-badge';
import CurrencyText from './components/currency-text';

export function Gallery() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <header>
        <h1 className="text-2xl font-bold">RCM UI Kit</h1>
        <p className="text-muted-foreground">
          Design-system components owned by the platform team. Runs standalone as a gallery.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-semibold">ClaimStatusBadge</h2>
        <div className="flex gap-2">
          <ClaimStatusBadge status="submitted" />
          <ClaimStatusBadge status="paid" />
          <ClaimStatusBadge status="denied" />
          <ClaimStatusBadge status="appealed" />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">AgingBadge</h2>
        <div className="flex gap-2">
          <AgingBadge days={12} />
          <AgingBadge days={45} />
          <AgingBadge days={75} />
          <AgingBadge days={118} />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">MetricCard</h2>
        <div className="grid grid-cols-3 gap-4">
          <MetricCard label="A/R Days" value="42.3" hint="Avg days in accounts receivable" />
          <MetricCard label="Clean Claim Rate" value="87.2%" />
          <MetricCard label="Denied $" value="$184,220" hint="Total denied this quarter" />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">CurrencyText</h2>
        <p>
          Balance due: <CurrencyText amount={12480.5} className="font-semibold" />
        </p>
      </section>
    </div>
  );
}
```

- [ ] **Step 10: Verify**

```bash
cd /Users/cthaeh/projects/lunch-and-learn-mfe
pnpm --filter uikit typecheck && pnpm --filter uikit build
```

Expected: both exit 0; `apps/uikit/dist/` contains `index.html` + static assets.

- [ ] **Step 11: Commit**

```bash
git add apps/uikit
git commit -m "feat(uikit): standalone RCM component gallery (Rsbuild + Tailwind v4)"
```

---

### Task 4: `apps/claims` — standalone full app (routing + query, no federation yet)

**Files:**
- Create: `apps/claims/package.json`, `apps/claims/tsconfig.json`, `apps/claims/rsbuild.config.ts`, `apps/claims/src/index.tsx`, `apps/claims/src/bootstrap.tsx`, `apps/claims/src/index.css`, `apps/claims/src/lib/utils.ts`, `apps/claims/src/lib/types.ts`, `apps/claims/src/lib/api.ts`, `apps/claims/src/ClaimsApp.tsx`, `apps/claims/src/components/status-badge.tsx`, `apps/claims/src/pages/claims-list.tsx`, `apps/claims/src/pages/claim-detail.tsx`

**Interfaces:**
- Consumes: claims-api HTTP endpoints (Task 2 shapes).
- Produces: default-exported `ClaimsApp` React component, props `{ basename?: string }` (defaults `'/'`). Routes *inside* the app are `/` (list) and `/:claimId` (detail) — the basename supplies any mount prefix. Federated in Task 10 as `claims/ClaimsApp`.

- [ ] **Step 1: Scaffold package + deps**

```bash
mkdir -p apps/claims/src/{lib,pages,components} && cd apps/claims
```

`apps/claims/package.json`:

```json
{
  "name": "claims",
  "private": true,
  "scripts": {
    "dev": "rsbuild dev",
    "build": "rsbuild build",
    "preview": "rsbuild preview",
    "typecheck": "tsc --noEmit"
  }
}
```

```bash
pnpm add react react-dom react-router @tanstack/react-query clsx tailwind-merge class-variance-authority
pnpm add -D @rsbuild/core @rsbuild/plugin-react @rsbuild/plugin-tailwindcss tailwindcss typescript @types/react @types/react-dom
```

- [ ] **Step 2: Copy identical config/css/util files**

- `apps/claims/tsconfig.json`: identical content to Task 3 Step 2.
- `apps/claims/src/index.css`: identical content to Task 3 Step 5.
- `apps/claims/src/lib/utils.ts`: identical content to Task 3 Step 6.
- `apps/claims/src/index.tsx`: identical content to Task 3 Step 4 (`import('./bootstrap');` with the same comment).

`apps/claims/rsbuild.config.ts`:

```ts
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindCSS } from '@rsbuild/plugin-tailwindcss';

export default defineConfig({
  plugins: [pluginReact(), pluginTailwindCSS()],
  html: { title: 'Claims Management' },
  server: { port: 3102 },
});
```

- [ ] **Step 3: Write `apps/claims/src/lib/types.ts`** (deliberate duplicate of the API's shapes — each "team" owns its own types)

```ts
export type ClaimStatus = 'submitted' | 'paid' | 'denied' | 'appealed';

export interface Claim {
  id: string;
  patientName: string;
  payer: string;
  amount: number;
  status: ClaimStatus;
  serviceDate: string;
  agingDays: number;
  denialReason?: { code: string; description: string };
  history: { date: string; status: string; note: string }[];
}

export interface Metrics {
  arDays: number;
  cleanClaimRate: number;
  totalDeniedAmount: number;
  openClaims: number;
}
```

- [ ] **Step 4: Write `apps/claims/src/lib/api.ts`**

```ts
import type { Claim } from './types';

const API_URL = 'http://localhost:4100';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json() as Promise<T>;
}

export function fetchClaims(status: string): Promise<Claim[]> {
  const qs = status === 'all' ? '' : `?status=${encodeURIComponent(status)}`;
  return get<Claim[]>(`/api/claims${qs}`);
}

export function fetchClaim(id: string): Promise<Claim> {
  return get<Claim>(`/api/claims/${encodeURIComponent(id)}`);
}
```

- [ ] **Step 5: Write `apps/claims/src/components/status-badge.tsx`** (claims team's own copy — visibly duplicated from uikit on purpose; a talking point, and it stays: claims never consumes uikit in this session)

```tsx
import { cva } from 'class-variance-authority';
import { cn } from '../lib/utils';
import type { ClaimStatus } from '../lib/types';

const badge = cva('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', {
  variants: {
    status: {
      submitted: 'bg-secondary text-secondary-foreground',
      paid: 'bg-emerald-600 text-white',
      denied: 'bg-destructive text-white',
      appealed: 'bg-amber-500 text-white',
    },
  },
});

const LABELS: Record<ClaimStatus, string> = {
  submitted: 'Submitted',
  paid: 'Paid',
  denied: 'Denied',
  appealed: 'Appealed',
};

export function StatusBadge({ status, className }: { status: ClaimStatus; className?: string }) {
  return <span className={cn(badge({ status }), className)}>{LABELS[status]}</span>;
}
```

- [ ] **Step 6: Write `apps/claims/src/pages/claims-list.tsx`**

```tsx
import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { fetchClaims } from '../lib/api';
import { StatusBadge } from '../components/status-badge';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const STATUSES = ['all', 'submitted', 'paid', 'denied', 'appealed'];

export function ClaimsList() {
  const [status, setStatus] = useState('all');
  const { data: claims, isLoading, error } = useQuery({
    queryKey: ['claims', status],
    queryFn: () => fetchClaims(status),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Claims</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : s}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading claims…</p>}
      {error && <p className="text-destructive">Failed to load claims: {String(error)}</p>}

      {claims && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Claim</th>
              <th className="py-2 pr-4 font-medium">Patient</th>
              <th className="py-2 pr-4 font-medium">Payer</th>
              <th className="py-2 pr-4 font-medium">Amount</th>
              <th className="py-2 pr-4 font-medium">Aging</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-2 pr-4">
                  <Link to={`/${c.id}`} className="font-medium underline-offset-2 hover:underline">
                    {c.id}
                  </Link>
                </td>
                <td className="py-2 pr-4">{c.patientName}</td>
                <td className="py-2 pr-4">{c.payer}</td>
                <td className="py-2 pr-4">{usd.format(c.amount)}</td>
                <td className="py-2 pr-4">{c.agingDays}d</td>
                <td className="py-2">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Write `apps/claims/src/pages/claim-detail.tsx`**

```tsx
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { fetchClaim } from '../lib/api';
import { StatusBadge } from '../components/status-badge';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ClaimDetail() {
  const { claimId } = useParams<{ claimId: string }>();
  const { data: claim, isLoading, error } = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => fetchClaim(claimId!),
    enabled: Boolean(claimId),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading claim…</p>;
  if (error || !claim) return <p className="text-destructive">Failed to load claim {claimId}</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-muted-foreground underline-offset-2 hover:underline">
          ← Back to claims
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-xl font-bold">{claim.id}</h1>
          <StatusBadge status={claim.status} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Patient</dt>
          <dd className="font-medium">{claim.patientName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Payer</dt>
          <dd className="font-medium">{claim.payer}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="font-medium">{usd.format(claim.amount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Aging</dt>
          <dd className="font-medium">{claim.agingDays} days</dd>
        </div>
      </dl>

      {claim.denialReason && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">
            Denial {claim.denialReason.code}
          </p>
          <p className="text-muted-foreground">{claim.denialReason.description}</p>
        </div>
      )}

      <div>
        <h2 className="mb-2 font-semibold">History</h2>
        <ol className="space-y-2 border-l border-border pl-4 text-sm">
          {claim.history.map((event, i) => (
            <li key={i}>
              <span className="text-muted-foreground">{event.date}</span>{' '}
              <span className="font-medium capitalize">{event.status}</span> — {event.note}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Write `apps/claims/src/ClaimsApp.tsx`** (the single module this app will expose)

```tsx
import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClaimsList } from './pages/claims-list';
import { ClaimDetail } from './pages/claim-detail';

export interface ClaimsAppProps {
  /** Mount path prefix. '/' standalone; '/claims' when embedded in a host. */
  basename?: string;
}

export default function ClaimsApp({ basename = '/' }: ClaimsAppProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [router] = useState(() =>
    createBrowserRouter(
      [
        { path: '/', element: <ClaimsList /> },
        { path: '/:claimId', element: <ClaimDetail /> },
      ],
      { basename },
    ),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="mx-auto max-w-5xl p-6">
        <RouterProvider router={router} />
      </div>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 9: Write `apps/claims/src/bootstrap.tsx`**

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ClaimsApp from './ClaimsApp';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClaimsApp basename="/" />
  </React.StrictMode>,
);
```

- [ ] **Step 10: Verify**

```bash
cd /Users/cthaeh/projects/lunch-and-learn-mfe
pnpm --filter claims typecheck && pnpm --filter claims build
```

Expected: exit 0 both.

- [ ] **Step 11: Commit**

```bash
git add apps/claims
git commit -m "feat(claims): standalone claims app with list/detail routing and TanStack Query"
```

---

### Task 5: `apps/worklist` — standalone denials widget (deliberately plain styling)

**Files:**
- Create: `apps/worklist/package.json`, `apps/worklist/tsconfig.json`, `apps/worklist/rsbuild.config.ts`, `apps/worklist/src/index.tsx`, `apps/worklist/src/bootstrap.tsx`, `apps/worklist/src/index.css`, `apps/worklist/src/lib/types.ts`, `apps/worklist/src/lib/api.ts`, `apps/worklist/src/WorklistWidget.tsx`

**Interfaces:**
- Consumes: `GET /api/denials` (Task 2).
- Produces: default-exported `WorklistWidget` React component, no props. Contains its own `QueryClientProvider` (moved to bootstrap in Task 13). Federated in Task 11 as `worklist/WorklistWidget`.

- [ ] **Step 1: Scaffold package + deps** (note: no cva/clsx — this team's styling is plain on purpose; uikit adoption happens live in step 4)

```bash
mkdir -p apps/worklist/src/lib && cd apps/worklist
```

`apps/worklist/package.json`:

```json
{
  "name": "worklist",
  "private": true,
  "scripts": {
    "dev": "rsbuild dev",
    "build": "rsbuild build",
    "preview": "rsbuild preview",
    "typecheck": "tsc --noEmit"
  }
}
```

```bash
pnpm add react react-dom @tanstack/react-query
pnpm add -D @rsbuild/core @rsbuild/plugin-react @rsbuild/plugin-tailwindcss tailwindcss typescript @types/react @types/react-dom
```

- [ ] **Step 2: Copy identical config files**

- `apps/worklist/tsconfig.json`: identical content to Task 3 Step 2.
- `apps/worklist/src/index.css`: identical content to Task 3 Step 5.
- `apps/worklist/src/index.tsx`: identical content to Task 3 Step 4.

`apps/worklist/rsbuild.config.ts`:

```ts
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindCSS } from '@rsbuild/plugin-tailwindcss';

export default defineConfig({
  plugins: [pluginReact(), pluginTailwindCSS()],
  html: { title: 'Denials Worklist' },
  server: { port: 3103 },
});
```

- [ ] **Step 3: Write `apps/worklist/src/lib/types.ts`**

```ts
export interface DeniedClaim {
  id: string;
  patientName: string;
  payer: string;
  amount: number;
  status: 'denied';
  agingDays: number;
  denialReason?: { code: string; description: string };
}
```

- [ ] **Step 4: Write `apps/worklist/src/lib/api.ts`**

```ts
import type { DeniedClaim } from './types';

const API_URL = 'http://localhost:4100';

export async function fetchDenials(): Promise<DeniedClaim[]> {
  const res = await fetch(`${API_URL}/api/denials`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for /api/denials`);
  return res.json() as Promise<DeniedClaim[]>;
}
```

- [ ] **Step 5: Write `apps/worklist/src/WorklistWidget.tsx`** (plain styling: raw text status, `toFixed` money, raw day counts — the "before" picture for step 4)

```tsx
import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { fetchDenials } from './lib/api';

function WorklistTable() {
  const { data: denials, isLoading, error } = useQuery({
    queryKey: ['denials'],
    queryFn: fetchDenials,
  });

  if (isLoading) return <p className="text-muted-foreground">Loading worklist…</p>;
  if (error || !denials) return <p className="text-destructive">Failed to load denials: {String(error)}</p>;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-1 font-semibold">Denials Worklist</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        {denials.length} denied claims, sorted by dollars at risk
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-1.5 pr-3 font-medium">Claim</th>
            <th className="py-1.5 pr-3 font-medium">Patient</th>
            <th className="py-1.5 pr-3 font-medium">Reason</th>
            <th className="py-1.5 pr-3 font-medium">Amount</th>
            <th className="py-1.5 pr-3 font-medium">Aging</th>
            <th className="py-1.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {denials.map((d) => (
            <tr key={d.id} className="border-b border-border">
              <td className="py-1.5 pr-3 font-medium">{d.id}</td>
              <td className="py-1.5 pr-3">{d.patientName}</td>
              <td className="py-1.5 pr-3">{d.denialReason?.code ?? '—'}</td>
              <td className="py-1.5 pr-3">${d.amount.toFixed(2)}</td>
              <td className="py-1.5 pr-3">{d.agingDays} days</td>
              <td className="py-1.5 uppercase">{d.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WorklistWidget() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <WorklistTable />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 6: Write `apps/worklist/src/bootstrap.tsx`**

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import WorklistWidget from './WorklistWidget';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="mx-auto max-w-4xl p-8">
      <WorklistWidget />
    </div>
  </React.StrictMode>,
);
```

- [ ] **Step 7: Verify**

```bash
cd /Users/cthaeh/projects/lunch-and-learn-mfe
pnpm --filter worklist typecheck && pnpm --filter worklist build
```

Expected: exit 0 both.

- [ ] **Step 8: Commit**

```bash
git add apps/worklist
git commit -m "feat(worklist): standalone denials worklist widget"
```

---

### Task 6: `apps/shell` — standalone host shell (placeholders, no federation yet)

**Files:**
- Create: `apps/shell/package.json`, `apps/shell/tsconfig.json`, `apps/shell/rsbuild.config.ts`, `apps/shell/src/index.tsx`, `apps/shell/src/bootstrap.tsx`, `apps/shell/src/index.css`, `apps/shell/src/lib/utils.ts`, `apps/shell/src/lib/types.ts`, `apps/shell/src/lib/api.ts`, `apps/shell/src/layout.tsx`, `apps/shell/src/router.tsx`, `apps/shell/src/components/kpi-tile.tsx`, `apps/shell/src/pages/dashboard.tsx`, `apps/shell/src/pages/claims-placeholder.tsx`

**Interfaces:**
- Consumes: `GET /api/metrics` (Task 2).
- Produces: shell route structure — `/` renders `Layout` with children `index` → `Dashboard` and `claims/*` → `ClaimsPlaceholder` (replaced by federated `ClaimsApp` in Task 10). `KpiTile` local component (replaced by federated `MetricCard` in Task 9), props `{ label: string; value: string; hint?: string }`.

- [ ] **Step 1: Scaffold package + deps**

```bash
mkdir -p apps/shell/src/{lib,pages,components} && cd apps/shell
```

`apps/shell/package.json`:

```json
{
  "name": "shell",
  "private": true,
  "scripts": {
    "dev": "rsbuild dev",
    "build": "rsbuild build",
    "preview": "rsbuild preview",
    "typecheck": "tsc --noEmit"
  }
}
```

```bash
pnpm add react react-dom react-router @tanstack/react-query clsx tailwind-merge
pnpm add -D @rsbuild/core @rsbuild/plugin-react @rsbuild/plugin-tailwindcss tailwindcss typescript @types/react @types/react-dom
```

- [ ] **Step 2: Copy identical config files**

- `apps/shell/tsconfig.json`: identical content to Task 3 Step 2.
- `apps/shell/src/index.css`: identical content to Task 3 Step 5.
- `apps/shell/src/lib/utils.ts`: identical content to Task 3 Step 6.
- `apps/shell/src/index.tsx`: identical content to Task 3 Step 4.

`apps/shell/rsbuild.config.ts`:

```ts
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindCSS } from '@rsbuild/plugin-tailwindcss';

export default defineConfig({
  plugins: [pluginReact(), pluginTailwindCSS()],
  html: { title: 'RCM Console' },
  server: { port: 3100 },
});
```

- [ ] **Step 3: Write `apps/shell/src/lib/types.ts` and `apps/shell/src/lib/api.ts`**

`types.ts`:

```ts
export interface Metrics {
  arDays: number;
  cleanClaimRate: number;
  totalDeniedAmount: number;
  openClaims: number;
}
```

`api.ts`:

```ts
import type { Metrics } from './types';

const API_URL = 'http://localhost:4100';

export async function fetchMetrics(): Promise<Metrics> {
  const res = await fetch(`${API_URL}/api/metrics`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for /api/metrics`);
  return res.json() as Promise<Metrics>;
}
```

- [ ] **Step 4: Write `apps/shell/src/components/kpi-tile.tsx`** (the shell team's homegrown tile — replaced by uikit's `MetricCard` in step 1 of the session)

```tsx
export interface KpiTileProps {
  label: string;
  value: string;
  hint?: string;
}

export function KpiTile({ label, value, hint }: KpiTileProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
```

- [ ] **Step 5: Write `apps/shell/src/layout.tsx`**

```tsx
import { NavLink, Outlet } from 'react-router';
import { cn } from './lib/utils';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/claims', label: 'Claims', end: false },
];

export function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-muted/30 p-4">
        <div className="mb-6 px-2">
          <p className="text-lg font-bold">RCM Console</p>
          <p className="text-xs text-muted-foreground">St. Elsewhere Health System</p>
        </div>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'block rounded-md px-2 py-1.5 text-sm font-medium',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Write `apps/shell/src/pages/dashboard.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
import { fetchMetrics } from '../lib/api';
import { KpiTile } from '../components/kpi-tile';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function Dashboard() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold">Revenue Cycle Dashboard</h1>
        <p className="text-sm text-muted-foreground">Today's picture across the health system</p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading metrics…</p>}
      {error && <p className="text-destructive">Failed to load metrics: {String(error)}</p>}

      {metrics && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiTile label="A/R Days" value={String(metrics.arDays)} hint="Avg age of open claims" />
          <KpiTile label="Clean Claim Rate" value={`${metrics.cleanClaimRate}%`} />
          <KpiTile
            label="Denied $"
            value={usd.format(metrics.totalDeniedAmount)}
            hint="Across all open denials"
          />
          <KpiTile label="Open Claims" value={String(metrics.openClaims)} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Write `apps/shell/src/pages/claims-placeholder.tsx`**

```tsx
export function ClaimsPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Claims</h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        The claims team ships their own app on port 3102. In step 2 of the session, their entire
        app — routing and all — gets mounted right here via module federation.
      </p>
    </div>
  );
}
```

- [ ] **Step 8: Write `apps/shell/src/router.tsx` and `apps/shell/src/bootstrap.tsx`**

`router.tsx`:

```tsx
import { createBrowserRouter } from 'react-router';
import { Layout } from './layout';
import { Dashboard } from './pages/dashboard';
import { ClaimsPlaceholder } from './pages/claims-placeholder';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'claims/*', element: <ClaimsPlaceholder /> },
    ],
  },
]);
```

`bootstrap.tsx`:

```tsx
import React from 'react';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { router } from './router';

function Root() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
```

- [ ] **Step 9: Verify all apps together**

```bash
cd /Users/cthaeh/projects/lunch-and-learn-mfe
pnpm typecheck && pnpm build
```

Expected: turbo runs `typecheck` and `build` across all 5 packages, all green.

- [ ] **Step 10: Commit**

```bash
git add apps/shell
git commit -m "feat(shell): standalone RCM Console host shell with dashboard and nav"
```

---

### Task 7: Docker — per-app nginx images, API image, single compose file

**Files:**
- Create: `apps/shell/Dockerfile`, `apps/shell/nginx.conf`, `apps/shell/.dockerignore` (same trio for `apps/uikit`, `apps/claims`, `apps/worklist`), `apps/claims/api/Dockerfile`, `apps/claims/api/.dockerignore`, `docker-compose.yml`

**Interfaces:**
- Consumes: each app's `pnpm build` → `dist/`; API's `pnpm start`.
- Produces: `docker compose up --build` serving shell :3100, uikit :3101, claims :3102, worklist :3103, api :4100 — same ports as dev.

- [ ] **Step 1: Write the frontend Dockerfile (identical file in each of the four app dirs)**

Each app builds in isolation from only its own directory — the docker build context IS the single-repo simulation.

`apps/shell/Dockerfile` (copy into `apps/uikit/`, `apps/claims/`, `apps/worklist/` unchanged):

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@10
COPY package.json ./
RUN pnpm install
COPY . .
RUN pnpm build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

- [ ] **Step 2: Write nginx config (identical file in each of the four app dirs)**

`apps/shell/nginx.conf` (copy into the other three app dirs unchanged). CORS header is what lets a host on :3100 fetch `remoteEntry`/chunks from :3101-:3103; `try_files` gives SPA history fallback.

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;

  location / {
    add_header Access-Control-Allow-Origin *;
    try_files $uri $uri/ /index.html;
  }
}
```

- [ ] **Step 3: Write `.dockerignore` (identical in all four app dirs)**

```
node_modules
dist
```

- [ ] **Step 4: Write `apps/claims/api/Dockerfile` + `.dockerignore`**

`Dockerfile`:

```dockerfile
FROM node:22-alpine
WORKDIR /app
RUN npm install -g pnpm@10
COPY package.json ./
RUN pnpm install
COPY . .
EXPOSE 4100
CMD ["pnpm", "start"]
```

`.dockerignore`:

```
node_modules
```

- [ ] **Step 5: Write root `docker-compose.yml`**

```yaml
# Production-style demo: each app built + served independently, same ports as dev,
# so remoteEntry URLs are identical in both modes. In real deployments you'd drive
# remote URLs per environment via the MF runtime / manifest instead.
services:
  claims-api:
    build: ./apps/claims/api
    ports:
      - '4100:4100'

  uikit:
    build: ./apps/uikit
    ports:
      - '3101:80'

  claims:
    build: ./apps/claims
    ports:
      - '3102:80'

  worklist:
    build: ./apps/worklist
    ports:
      - '3103:80'

  shell:
    build: ./apps/shell
    ports:
      - '3100:80'
    depends_on:
      - claims-api
      - uikit
      - claims
      - worklist
```

- [ ] **Step 6: Verify**

```bash
cd /Users/cthaeh/projects/lunch-and-learn-mfe
docker compose build
docker compose up -d
sleep 3
curl -s http://localhost:4100/health
curl -s -o /dev/null -w "shell:%{http_code} " http://localhost:3100
curl -s -o /dev/null -w "uikit:%{http_code} " http://localhost:3101
curl -s -o /dev/null -w "claims:%{http_code} " http://localhost:3102
curl -s -o /dev/null -w "worklist:%{http_code}\n" http://localhost:3103
docker compose down
```

Expected: `{"ok":true}` and `200` for all four frontends.

- [ ] **Step 7: Commit**

```bash
git add apps/*/Dockerfile apps/*/nginx.conf apps/*/.dockerignore apps/claims/api/Dockerfile apps/claims/api/.dockerignore docker-compose.yml
git commit -m "feat(docker): per-app images and single compose file, dev-identical ports"
```

---

### Task 8: README runbook + `start` branch

**Files:**
- Create: `README.md`

**Interfaces:**
- Produces: the `start` branch — the exact state attendees clone. Everything after this task happens on `main` only.

- [ ] **Step 1: Write `README.md`**

````markdown
# Module Federation Lunch & Learn — RCM Console

A code-along teaching module federation in React. Four apps + one API, modeled on a
hospital revenue cycle management (RCM) platform. Each app is written as if it lived in
its own repo owned by its own team — this monorepo is just so you only clone once.

| App | Port | Role |
|---|---|---|
| `apps/shell` | 3100 | RCM Console — the host |
| `apps/uikit` | 3101 | Design system components — remote |
| `apps/claims` | 3102 | Claims Management — a full app as a remote |
| `apps/worklist` | 3103 | Denials Worklist widget — remote, later host+remote |
| `apps/claims/api` | 4100 | Express API (fake seeded data) |

## Before the session (please do this ahead of time!)

Prereqs: Node 22+, pnpm 10 (`corepack enable`), Docker Desktop (optional, for the finale).

```bash
git clone <repo-url> && cd lunch-and-learn-mfe
git checkout start
pnpm install
pnpm dev
```

Open all five: http://localhost:3100 (shell), :3101 (uikit gallery), :3102 (claims),
:3103 (worklist), :4100/health (api). Five independent apps, zero federation — yet.

## Session steps

We code each step live. Fall behind? Jump to the checkpoint:

```bash
git stash && git checkout step-2   # or step-1..step-5
pnpm install
```

1. **step-1 — Hello federation.** uikit exposes its components; shell consumes them.
   `exposes` / `remotes` / `shared` singletons + federated TypeScript types.
2. **step-2 — A whole app as a remote.** claims exposes `ClaimsApp`; shell mounts it
   under `/claims/*`. Routing composition and `basename`.
3. **step-3 — Widget remote.** worklist lands on the shell dashboard.
4. **step-4 — A remote becomes a host.** worklist consumes uikit while the shell
   consumes worklist. Federation is a graph, not a tree.
5. **step-5 — Sharing state (stretch).** `@tanstack/react-query` becomes a shared
   singleton; the worklist widget rides the shell's QueryClient and cache.

## The finale: independent deploys

```bash
docker compose up --build
```

Same five URLs — but now every app is its own image behind its own nginx, and the shell
is loading remotes cross-origin exactly like independently deployed micro-frontends.

## Troubleshooting

- **Port in use:** something else owns 3100-3103/4100; kill it or restart.
- **Blank page after checkout:** re-run `pnpm install` (deps change between steps), restart `pnpm dev`.
- **Remote fails to load:** is the remote's dev server running? Check the browser console
  for the failing `mf-manifest.json` URL.
````

- [ ] **Step 2: Commit and create the `start` branch**

```bash
git add README.md
git commit -m "docs: session runbook README"
git branch start   # frozen pre-federation state; attendees clone this
```

- [ ] **Step 3: Verify**

Run: `git log --oneline -3 && git branch --list start`
Expected: `start` exists pointing at HEAD.

---

### Task 9: Session step 1 — uikit exposes, shell consumes (tag `step-1`)

**Files:**
- Modify: `apps/uikit/rsbuild.config.ts`, `apps/shell/rsbuild.config.ts`, `apps/shell/tsconfig.json`, `apps/shell/src/pages/dashboard.tsx`
- Delete: `apps/shell/src/components/kpi-tile.tsx`

**Interfaces:**
- Consumes: uikit component prop contracts from Task 3.
- Produces: remote `uikit` with exposed modules `uikit/ClaimStatusBadge`, `uikit/MetricCard`, `uikit/AgingBadge`, `uikit/CurrencyText`; consumed via manifest URL `http://localhost:3101/mf-manifest.json`. Shell tsconfig gains `paths: { "*": ["./@mf-types/*"] }` (Tasks 10-11 reuse it).

- [ ] **Step 1: Install the MF plugin in both apps**

```bash
cd /Users/cthaeh/projects/lunch-and-learn-mfe
pnpm --filter uikit add -D @module-federation/rsbuild-plugin
pnpm --filter shell add -D @module-federation/rsbuild-plugin
```

- [ ] **Step 2: Make uikit a remote — replace `apps/uikit/rsbuild.config.ts`**

```ts
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindCSS } from '@rsbuild/plugin-tailwindcss';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTailwindCSS(),
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
  ],
  html: { title: 'RCM UI Kit' },
  server: { port: 3101, cors: true },
  // A remote must know its own public URL so chunks/manifest resolve cross-origin.
  dev: { assetPrefix: 'http://localhost:3101' },
  output: { assetPrefix: 'http://localhost:3101' },
});
```

- [ ] **Step 3: Make shell a host — replace `apps/shell/rsbuild.config.ts`**

```ts
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindCSS } from '@rsbuild/plugin-tailwindcss';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTailwindCSS(),
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
  ],
  html: { title: 'RCM Console' },
  server: { port: 3100 },
});
```

- [ ] **Step 4: Point shell's tsconfig at federated types — edit `apps/shell/tsconfig.json` compilerOptions, add:**

```json
    "paths": {
      "*": ["./@mf-types/*"]
    }
```

- [ ] **Step 5: Consume uikit on the dashboard — replace `apps/shell/src/pages/dashboard.tsx`, delete `apps/shell/src/components/kpi-tile.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
// Federated imports: these modules live in the uikit app running on :3101.
import MetricCard from 'uikit/MetricCard';
import { fetchMetrics } from '../lib/api';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function Dashboard() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold">Revenue Cycle Dashboard</h1>
        <p className="text-sm text-muted-foreground">Today's picture across the health system</p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading metrics…</p>}
      {error && <p className="text-destructive">Failed to load metrics: {String(error)}</p>}

      {metrics && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="A/R Days" value={String(metrics.arDays)} hint="Avg age of open claims" />
          <MetricCard label="Clean Claim Rate" value={`${metrics.cleanClaimRate}%`} />
          <MetricCard
            label="Denied $"
            value={usd.format(metrics.totalDeniedAmount)}
            hint="Across all open denials"
          />
          <MetricCard label="Open Claims" value={String(metrics.openClaims)} />
        </div>
      )}
    </div>
  );
}
```

```bash
git rm apps/shell/src/components/kpi-tile.tsx
```

- [ ] **Step 6: Verify**

```bash
cd /Users/cthaeh/projects/lunch-and-learn-mfe
pnpm --filter uikit build          # generates @mf-types + manifest
pnpm --filter shell typecheck || true   # may need uikit dev running for fresh types; see note
pnpm --filter shell build
pnpm build                          # everything still green
```

Then a live check: run `pnpm dev`, open http://localhost:3100 — dashboard KPI tiles now render from uikit (kill the uikit dev server and reload to show the failure mode, then restart it).

Note: federated `*.d.ts` for the shell are pulled from the running/built uikit. If `typecheck` fails on `uikit/MetricCard` types, start `pnpm --filter uikit dev` (or ensure its build ran) and rerun — the MF dts consumer downloads types into `apps/shell/@mf-types/`.

- [ ] **Step 7: Commit + tag**

```bash
git add -A
git commit -m "feat(step-1): uikit exposes components, shell consumes them"
git tag -a step-1 -m "Step 1: hello federation - uikit remote consumed by shell"
```

---

### Task 10: Session step 2 — claims app mounted in shell (tag `step-2`)

**Files:**
- Modify: `apps/claims/rsbuild.config.ts`, `apps/shell/rsbuild.config.ts`, `apps/shell/src/router.tsx`
- Delete: `apps/shell/src/pages/claims-placeholder.tsx`

**Interfaces:**
- Consumes: `ClaimsApp` default export with `{ basename?: string }` (Task 4).
- Produces: remote `claims` exposing `./ClaimsApp`; shell route `claims/*` renders it with `basename="/claims"`.

- [ ] **Step 1: Install MF plugin in claims**

```bash
pnpm --filter claims add -D @module-federation/rsbuild-plugin
```

- [ ] **Step 2: Make claims a remote — replace `apps/claims/rsbuild.config.ts`**

```ts
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindCSS } from '@rsbuild/plugin-tailwindcss';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTailwindCSS(),
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
  ],
  html: { title: 'Claims Management' },
  server: { port: 3102, cors: true },
  dev: { assetPrefix: 'http://localhost:3102' },
  output: { assetPrefix: 'http://localhost:3102' },
});
```

- [ ] **Step 3: Add the remote to shell — in `apps/shell/rsbuild.config.ts`, extend `remotes`:**

```ts
      remotes: {
        uikit: 'uikit@http://localhost:3101/mf-manifest.json',
        claims: 'claims@http://localhost:3102/mf-manifest.json',
      },
```

- [ ] **Step 4: Mount it — replace `apps/shell/src/router.tsx`, delete the placeholder page**

```tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './layout';
import { Dashboard } from './pages/dashboard';

// The entire claims application — routing, data layer and all — loaded at runtime
// from the claims team's deployment on :3102.
const ClaimsApp = lazy(() => import('claims/ClaimsApp'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: 'claims/*',
        element: (
          <Suspense fallback={<p className="p-6 text-muted-foreground">Loading claims app…</p>}>
            <ClaimsApp basename="/claims" />
          </Suspense>
        ),
      },
    ],
  },
]);
```

```bash
git rm apps/shell/src/pages/claims-placeholder.tsx
```

- [ ] **Step 5: Verify**

```bash
cd /Users/cthaeh/projects/lunch-and-learn-mfe
pnpm --filter claims build
pnpm --filter shell build
pnpm build
```

Live check with `pnpm dev`: http://localhost:3100/claims shows the claims list inside the shell chrome; click a claim → URL becomes `/claims/CLM-10xx`; browser back works; deep-link a detail URL directly; http://localhost:3102 still works standalone.

- [ ] **Step 6: Commit + tag**

```bash
git add -A
git commit -m "feat(step-2): claims app exposed and mounted at /claims in shell"
git tag -a step-2 -m "Step 2: full app as a remote with routing composition"
```

---

### Task 11: Session step 3 — worklist widget on the dashboard (tag `step-3`)

**Files:**
- Modify: `apps/worklist/rsbuild.config.ts`, `apps/shell/rsbuild.config.ts`, `apps/shell/src/pages/dashboard.tsx`

**Interfaces:**
- Consumes: `WorklistWidget` default export, no props (Task 5).
- Produces: remote `worklist` exposing `./WorklistWidget`.

- [ ] **Step 1: Install MF plugin in worklist**

```bash
pnpm --filter worklist add -D @module-federation/rsbuild-plugin
```

- [ ] **Step 2: Make worklist a remote — replace `apps/worklist/rsbuild.config.ts`**

```ts
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindCSS } from '@rsbuild/plugin-tailwindcss';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTailwindCSS(),
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
  ],
  html: { title: 'Denials Worklist' },
  server: { port: 3103, cors: true },
  dev: { assetPrefix: 'http://localhost:3103' },
  output: { assetPrefix: 'http://localhost:3103' },
});
```

- [ ] **Step 3: Add remote to shell — in `apps/shell/rsbuild.config.ts`, extend `remotes`:**

```ts
      remotes: {
        uikit: 'uikit@http://localhost:3101/mf-manifest.json',
        claims: 'claims@http://localhost:3102/mf-manifest.json',
        worklist: 'worklist@http://localhost:3103/mf-manifest.json',
      },
```

- [ ] **Step 4: Render it on the dashboard — in `apps/shell/src/pages/dashboard.tsx`:**

Add imports at the top:

```tsx
import { lazy, Suspense } from 'react';

const WorklistWidget = lazy(() => import('worklist/WorklistWidget'));
```

Add below the metrics grid, inside the outer `<div className="space-y-6 p-6">`:

```tsx
      <Suspense fallback={<p className="text-muted-foreground">Loading worklist…</p>}>
        <WorklistWidget />
      </Suspense>
```

- [ ] **Step 5: Verify**

```bash
pnpm --filter worklist build && pnpm --filter shell build && pnpm build
```

Live check: shell dashboard shows the denials table below the KPI tiles; :3103 still works standalone.

- [ ] **Step 6: Commit + tag**

```bash
git add -A
git commit -m "feat(step-3): worklist widget federated onto shell dashboard"
git tag -a step-3 -m "Step 3: widget remote on the dashboard"
```

---

### Task 12: Session step 4 — worklist becomes host+remote (tag `step-4`)

**Files:**
- Modify: `apps/worklist/rsbuild.config.ts`, `apps/worklist/tsconfig.json`, `apps/worklist/src/WorklistWidget.tsx`

**Interfaces:**
- Consumes: `uikit/ClaimStatusBadge`, `uikit/AgingBadge`, `uikit/CurrencyText` (Task 3 contracts).
- Produces: the federation graph shell → worklist → uikit (worklist is simultaneously remote and host).

- [ ] **Step 1: Give worklist its own `remotes` — in `apps/worklist/rsbuild.config.ts`, extend `pluginModuleFederation` options (keeping name/exposes/shared as-is):**

```ts
      remotes: {
        uikit: 'uikit@http://localhost:3101/mf-manifest.json',
      },
```

- [ ] **Step 2: Federated types for worklist — add to `apps/worklist/tsconfig.json` compilerOptions:**

```json
    "paths": {
      "*": ["./@mf-types/*"]
    }
```

- [ ] **Step 3: Adopt the design system — replace `apps/worklist/src/WorklistWidget.tsx`:**

```tsx
import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
// This app is consumed BY the shell and now consumes uikit itself: host+remote.
import ClaimStatusBadge from 'uikit/ClaimStatusBadge';
import AgingBadge from 'uikit/AgingBadge';
import CurrencyText from 'uikit/CurrencyText';
import { fetchDenials } from './lib/api';

function WorklistTable() {
  const { data: denials, isLoading, error } = useQuery({
    queryKey: ['denials'],
    queryFn: fetchDenials,
  });

  if (isLoading) return <p className="text-muted-foreground">Loading worklist…</p>;
  if (error || !denials) return <p className="text-destructive">Failed to load denials: {String(error)}</p>;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-1 font-semibold">Denials Worklist</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        {denials.length} denied claims, sorted by dollars at risk
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-1.5 pr-3 font-medium">Claim</th>
            <th className="py-1.5 pr-3 font-medium">Patient</th>
            <th className="py-1.5 pr-3 font-medium">Reason</th>
            <th className="py-1.5 pr-3 font-medium">Amount</th>
            <th className="py-1.5 pr-3 font-medium">Aging</th>
            <th className="py-1.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {denials.map((d) => (
            <tr key={d.id} className="border-b border-border">
              <td className="py-1.5 pr-3 font-medium">{d.id}</td>
              <td className="py-1.5 pr-3">{d.patientName}</td>
              <td className="py-1.5 pr-3">{d.denialReason?.code ?? '—'}</td>
              <td className="py-1.5 pr-3">
                <CurrencyText amount={d.amount} />
              </td>
              <td className="py-1.5 pr-3">
                <AgingBadge days={d.agingDays} />
              </td>
              <td className="py-1.5">
                <ClaimStatusBadge status={d.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WorklistWidget() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <WorklistTable />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: Verify**

```bash
pnpm --filter worklist build && pnpm build
```

Live check: shell dashboard's worklist now shows uikit badges/currency; :3103 standalone shows the same upgrade. In the browser network tab, note the shell page pulls uikit chunks once even though both shell and worklist reference them.

- [ ] **Step 5: Commit + tag**

```bash
git add -A
git commit -m "feat(step-4): worklist consumes uikit - a remote becomes a host"
git tag -a step-4 -m "Step 4: host+remote, federation is a graph"
```

---

### Task 13: Session step 5 — shared QueryClient singleton + devtools (tag `step-5`)

**Files:**
- Modify: `apps/worklist/rsbuild.config.ts`, `apps/worklist/src/WorklistWidget.tsx`, `apps/worklist/src/bootstrap.tsx`, `apps/shell/rsbuild.config.ts`, `apps/shell/src/bootstrap.tsx`

**Interfaces:**
- Consumes: shell's `QueryClientProvider` context (via singleton-shared `@tanstack/react-query`).
- Produces: `WorklistWidget` no longer owns a provider — embedded, it uses whatever client the host provides; standalone, its bootstrap provides one. Claims keeps its own client on purpose (talking point).

- [ ] **Step 1: Add react-query to shared in BOTH `apps/shell/rsbuild.config.ts` and `apps/worklist/rsbuild.config.ts`:**

```ts
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        // Singleton so host and remote share ONE module instance -> ONE React context
        // -> the widget picks up the shell's QueryClient (and its cache) automatically.
        '@tanstack/react-query': { singleton: true },
      },
```

- [ ] **Step 2: Remove the provider from the widget — in `apps/worklist/src/WorklistWidget.tsx`:**

Replace the imports and default export (WorklistTable stays exactly as in Task 12):

```tsx
import { useQuery } from '@tanstack/react-query';
```

(drop `useState`, `QueryClient`, `QueryClientProvider` from imports), and:

```tsx
export default function WorklistWidget() {
  // No provider here: embedded, we ride the host's QueryClient; standalone,
  // bootstrap.tsx provides one. Requires @tanstack/react-query to be a shared singleton.
  return <WorklistTable />;
}
```

- [ ] **Step 3: Provide a client standalone — replace `apps/worklist/src/bootstrap.tsx`:**

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import WorklistWidget from './WorklistWidget';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <div className="mx-auto max-w-4xl p-8">
        <WorklistWidget />
      </div>
    </QueryClientProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 4: Add query devtools to shell (visual proof of the shared cache)**

```bash
pnpm --filter shell add @tanstack/react-query-devtools
```

In `apps/shell/src/bootstrap.tsx`, add the import and render it inside the provider:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
```

```tsx
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
```

- [ ] **Step 5: Verify**

```bash
pnpm build && pnpm typecheck
```

Live check: open shell dashboard → React Query devtools shows BOTH `['metrics']` and `['denials']` in one cache (the `denials` query lives in the worklist's code but the shell's client). Worklist standalone on :3103 still works.

- [ ] **Step 6: Commit + tag**

```bash
git add -A
git commit -m "feat(step-5): share QueryClient via react-query singleton, add devtools"
git tag -a step-5 -m "Step 5: shared state via singleton - one QueryClient across host and remote"
```

---

### Task 14: Full-sweep verification

**Files:** none (verification only)

- [ ] **Step 1: Every ref builds green**

```bash
cd /Users/cthaeh/projects/lunch-and-learn-mfe
for ref in start step-1 step-2 step-3 step-4 step-5 main; do
  git checkout -q "$ref" && pnpm install --silent && pnpm build || { echo "FAILED at $ref"; break; }
  echo "OK: $ref"
done
git checkout main
```

Expected: `OK:` for all seven refs.

- [ ] **Step 2: Docker finale works on main**

```bash
docker compose build
docker compose up -d
sleep 3
curl -s http://localhost:4100/health
curl -s -o /dev/null -w "shell:%{http_code}\n" http://localhost:3100
docker compose down
```

Expected: `{"ok":true}` and `shell:200`. Then a manual browser pass of http://localhost:3100 while compose is up (KPIs render, /claims works, worklist shows badges).

- [ ] **Step 3: Live dev pass (manual)**

`pnpm dev`, then walk: shell dashboard (uikit tiles + worklist with badges), /claims list → detail → back, deep-link /claims/CLM-1005, all four standalone URLs, query devtools showing the shared cache.

- [ ] **Step 4: Push everything**

```bash
git push origin main start --tags
```

(Only if a remote exists; skip otherwise.)
