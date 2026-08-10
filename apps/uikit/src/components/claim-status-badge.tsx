// Exposed modules own their styles: this app's CSS travels with the module
// through federation instead of relying on the host to build the same classes.
import '../index.css';
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
