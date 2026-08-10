export type ClaimStatus = 'submitted' | 'paid' | 'denied' | 'appealed';

export interface Claim {
  id: string;
  patientName: string;
  payer: string;
  amount: number;
  status: ClaimStatus;
  serviceDate: string;
  agingDays: number;
  denialReason?: { code: string; description: string };
  history: { date: string; status: string; note: string }[];
}

export interface Metrics {
  arDays: number;
  cleanClaimRate: number;
  totalDeniedAmount: number;
  openClaims: number;
}
