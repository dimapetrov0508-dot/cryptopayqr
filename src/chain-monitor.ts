import type { Network } from './payment.js';

export interface ChainTransaction { hash: string; network: Network; token: 'USDT'; amount: number; recipient: string; confirmations: number; }
export interface ChainMonitor { findPayment(input: { address: string; amount: number; network: Network; since: Date }): Promise<ChainTransaction | null>; }

export class RpcChainMonitor implements ChainMonitor {
  constructor(private readonly endpoints: Record<Network, string>) {}
  async findPayment(input: { address: string; amount: number; network: Network; since: Date }): Promise<ChainTransaction | null> {
    const endpoint = this.endpoints[input.network];
    if (!endpoint) throw new Error(`RPC endpoint is not configured for ${input.network}`);
    // Network-specific indexer calls are intentionally isolated here. Never trust client-supplied tx data.
    void input; void endpoint;
    return null;
  }
}
