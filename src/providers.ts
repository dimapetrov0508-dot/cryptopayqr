export interface FiatProvider {
  createQuote(input: { amountRub: number; network: 'TRC20'|'BEP20' }): Promise<{ usdt: number; rate: number; fee: number }>;
  createPayout(input: { amountRub: number; phone: string; bank: string }): Promise<{ id: string; status: string }>;
}

export class DemoFiatProvider implements FiatProvider {
  async createQuote(input: { amountRub: number; network: 'TRC20'|'BEP20' }) {
    const rate = 92.5; const fee = 0.015;
    return { usdt: Number((input.amountRub / rate * (1 + fee)).toFixed(6)), rate, fee };
  }
  async createPayout() { return { id: `demo_${Date.now()}`, status: 'demo_pending' }; }
}
