// Exposed modules own their styles: this app's CSS travels with the module
// through federation instead of relying on the host to build the same classes.
import '../index.css';
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function CurrencyText({ amount, className }: { amount: number; className?: string }) {
  return <span className={className}>{usd.format(amount)}</span>;
}
