export type ClaimStatus = 'submitted' | 'paid' | 'denied' | 'appealed';

export interface DenialReason {
  code: string;
  description: string;
}

export interface ClaimEvent {
  date: string;
  status: string;
  note: string;
}

export interface Claim {
  id: string;
  patientName: string;
  payer: string;
  amount: number;
  status: ClaimStatus;
  serviceDate: string;
  agingDays: number;
  denialReason?: DenialReason;
  history: ClaimEvent[];
}
