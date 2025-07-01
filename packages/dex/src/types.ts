import { SupportedChain } from "./types/chains";
import { Token } from "@stratospherex/sdk";
import { Wallet } from "ethers";

export interface Config {
  chain: SupportedChain;
  wallet: Wallet;
}

export interface EstimatedSwap {
    price: number;
    total: number;
    trading_fee: number;
    price_impact: number;
    routes: Token[];
}