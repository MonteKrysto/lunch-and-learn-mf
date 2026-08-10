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
