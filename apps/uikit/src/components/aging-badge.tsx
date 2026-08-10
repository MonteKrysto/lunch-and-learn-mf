// Exposed modules own their styles: this app's CSS travels with the module
// through federation instead of relying on the host to build the same classes.
import '../index.css';
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
