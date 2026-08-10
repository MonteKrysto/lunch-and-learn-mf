export interface DeniedClaim {
  id: string;
  patientName: string;
  payer: string;
  amount: number;
  status: 'denied';
  agingDays: number;
  denialReason?: { code: string; description: string };
}
