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
