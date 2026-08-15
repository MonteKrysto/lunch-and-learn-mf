// Exposed modules own their styles: this app's CSS travels with the module
// through federation instead of relying on the host to build the same classes.
import './index.css';
import { useQuery } from '@tanstack/react-query';
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
  // No provider here: embedded, we ride the host's QueryClient; standalone,
  // bootstrap.tsx provides one. Requires @tanstack/react-query to be a shared singleton.
  return <WorklistTable />;
}
