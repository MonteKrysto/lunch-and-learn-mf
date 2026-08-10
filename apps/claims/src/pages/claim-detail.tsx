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
