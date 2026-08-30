import { lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RemoteBoundary } from '../components/remote-boundary';
// Federated imports: these modules live in the uikit app running on :3101.
import MetricCard from 'uikit/MetricCard';
import { fetchMetrics } from '../lib/api';

const WorklistWidget = lazy(() => import('worklist/WorklistWidget'));

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

      <RemoteBoundary name="denials worklist">
        <Suspense fallback={<p className="text-muted-foreground">Loading worklist…</p>}>
          <WorklistWidget />
        </Suspense>
      </RemoteBoundary>
    </div>
  );
}
