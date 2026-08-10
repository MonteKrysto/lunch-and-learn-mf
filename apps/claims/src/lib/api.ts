import type { Claim } from './types';

const API_URL = 'http://localhost:4100';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json() as Promise<T>;
}

export function fetchClaims(status: string): Promise<Claim[]> {
  const qs = status === 'all' ? '' : `?status=${encodeURIComponent(status)}`;
  return get<Claim[]>(`/api/claims${qs}`);
}

export function fetchClaim(id: string): Promise<Claim> {
  return get<Claim>(`/api/claims/${encodeURIComponent(id)}`);
}
