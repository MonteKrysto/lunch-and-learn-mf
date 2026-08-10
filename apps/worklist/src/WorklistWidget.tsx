// Exposed modules own their styles: this app's CSS travels with the module
// through federation instead of relying on the host to build the same classes.
import './index.css';
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
