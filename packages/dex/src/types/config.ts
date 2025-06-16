import { SupportedChain } from "./chains";

export enum DexProvider {
    SPHERE = "sphere",
}

export interface Config {
    chain: SupportedChain;
    provider: DexProvider;
}