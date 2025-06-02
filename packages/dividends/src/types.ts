export interface DividendConfig {
  tokenAddress: string;
  amount: string;
  startTime: number;
  endTime: number;
}

export interface DividendInfo {
  tokenAddress: string;
  totalAmount: string;
  claimedAmount: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
} 