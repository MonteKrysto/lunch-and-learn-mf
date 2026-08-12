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
