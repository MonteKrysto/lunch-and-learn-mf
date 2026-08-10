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
