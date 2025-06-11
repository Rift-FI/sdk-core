import { SupportedChain } from "@stratosphere-network/shared";
import { Wallet } from "ethers";

export interface Config {
  chain: SupportedChain;
  wallet: Wallet;
}
