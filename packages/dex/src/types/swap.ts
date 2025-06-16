import { Token } from "@stratospherex/sdk";

export interface EstimatedSwap {
    price: number;
    total: number;
    trading_fee: number;
    price_impact: number;
    routes: Token[];
}