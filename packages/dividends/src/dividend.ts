import { DividendConfig, DividendInfo } from './types';

export class Dividend {
  constructor(private readonly config: DividendConfig) {}

  getInfo(): DividendInfo {
    const now = Math.floor(Date.now() / 1000);
    return {
      tokenAddress: this.config.tokenAddress,
      totalAmount: this.config.amount,
      claimedAmount: '0', // This will be implemented with actual contract interaction
      startTime: this.config.startTime,
      endTime: this.config.endTime,
      isActive: now >= this.config.startTime && now <= this.config.endTime
    };
  }
} 