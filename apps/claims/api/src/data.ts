import type { Claim, ClaimStatus, DenialReason } from './types.js';

// Deterministic PRNG so every clone sees identical data.
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260809);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

const PAYERS = ['Aetna', 'UnitedHealthcare', 'Cigna', 'BCBS of TX', 'Humana', 'Medicare'];
const FIRST = ['Maria', 'James', 'Wei', 'Aisha', 'Carlos', 'Emily', 'Raj', 'Sofia', 'Tyrone', 'Hannah'];
const LAST = ['Garcia', 'Okafor', 'Chen', 'Patel', 'Johnson', 'Nguyen', 'Smith', 'Kowalski', 'Reyes', 'Kim'];

const DENIAL_REASONS: DenialReason[] = [
  { code: 'CO-45', description: 'Charge exceeds fee schedule' },
  { code: 'CO-97', description: 'Service included in another procedure' },
  { code: 'CO-16', description: 'Claim lacks required information' },
  { code: 'CO-29', description: 'Timely filing limit expired' },
  { code: 'PR-1', description: 'Deductible amount' },
  { code: 'CO-11', description: 'Diagnosis inconsistent with procedure' },
];

// Weighted status distribution: enough denials to make the worklist interesting.
const STATUS_POOL: ClaimStatus[] = [
  'submitted', 'submitted', 'submitted',
  'paid', 'paid', 'paid', 'paid',
  'denied', 'denied',
  'appealed',
];

function buildClaim(i: number): Claim {
  const status = pick(STATUS_POOL);
  const agingDays = Math.floor(rand() * 120) + 1;
  const serviceDate = new Date(Date.UTC(2026, 3, 1 + Math.floor(rand() * 90)));
  const amount = Math.round((150 + rand() * 24850) * 100) / 100;
  const patientName = `${pick(FIRST)} ${pick(LAST)}`;
  const submitted = {
    date: serviceDate.toISOString().slice(0, 10),
    status: 'submitted',
    note: 'Claim submitted to payer',
  };
  const claim: Claim = {
    id: `CLM-${1001 + i}`,
    patientName,
    payer: pick(PAYERS),
    amount,
    status,
    serviceDate: serviceDate.toISOString().slice(0, 10),
    agingDays,
    history: [submitted],
  };
  if (status === 'denied' || status === 'appealed') {
    claim.denialReason = pick(DENIAL_REASONS);
    claim.history.push({
      date: serviceDate.toISOString().slice(0, 10),
      status: 'denied',
      note: `Denied: ${claim.denialReason.code} — ${claim.denialReason.description}`,
    });
  }
  if (status === 'appealed') {
    claim.history.push({
      date: serviceDate.toISOString().slice(0, 10),
      status: 'appealed',
      note: 'Appeal filed with supporting documentation',
    });
  }
  if (status === 'paid') {
    claim.history.push({
      date: serviceDate.toISOString().slice(0, 10),
      status: 'paid',
      note: 'Payment posted',
    });
  }
  return claim;
}

export const claims: Claim[] = Array.from({ length: 50 }, (_, i) => buildClaim(i));
