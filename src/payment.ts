export type Network = 'TRC20' | 'BEP20';
export type PaymentStatus = 'created' | 'awaiting_payment' | 'detected' | 'confirming' | 'paid' | 'expired' | 'failed';

export const NETWORKS: Record<Network, { chain: string; token: string; confirmations: number }> = {
  TRC20: { chain: 'TRON', token: 'USDT', confirmations: 20 },
  BEP20: { chain: 'BNB Smart Chain', token: 'USDT', confirmations: 12 },
};

export function assertNetwork(value: unknown): Network {
  if (value !== 'TRC20' && value !== 'BEP20') throw new Error('Unsupported network');
  return value;
}

export function nextStatus(status: PaymentStatus, event: 'created'|'tx_detected'|'confirmations_complete'|'expired'|'error'): PaymentStatus {
  if (event === 'expired') return 'expired';
  if (event === 'error') return 'failed';
  if (event === 'tx_detected') return 'detected';
  if (event === 'confirmations_complete') return 'paid';
  return status === 'created' ? 'awaiting_payment' : status;
}
