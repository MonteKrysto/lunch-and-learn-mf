import type { DeniedClaim } from './types';

const API_URL = 'http://localhost:4100';

export async function fetchDenials(): Promise<DeniedClaim[]> {
  const res = await fetch(`${API_URL}/api/denials`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for /api/denials`);
  return res.json() as Promise<DeniedClaim[]>;
}
