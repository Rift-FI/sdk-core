export interface AddLiquidityParams {
  tokenA: string;
  tokenB: string;
  amountA: string;
  amountB: string;
}

export interface IncreaseLiquidityParams {
  tokenId: number;  // The NFT token ID of the position
  amountA: string;  // Additional amount of token A
  amountB: string;  // Additional amount of token B
}

export interface EstimatedLiquidity {
  poolAddress: string;
  fee: number;
  tokenAAmount: string;
  tokenBAmount: string;
} 