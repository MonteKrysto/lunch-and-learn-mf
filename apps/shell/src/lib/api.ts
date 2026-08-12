import type { Metrics } from './types';

const API_URL = 'http://localhost:4100';

export async function fetchMetrics(): Promise<Metrics> {
  const res = await fetch(`${API_URL}/api/metrics`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for /api/metrics`);
  return res.json() as Promise<Metrics>;
}
