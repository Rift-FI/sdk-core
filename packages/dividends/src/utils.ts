import { DividendsError } from "./error";
import { Chain, SupportedChain } from "./types";

export function getChainFromSupportedChain(chain: SupportedChain): Chain {
  // Map SupportedChain enum to Chain interface with id and rpcUrl
  switch (chain) {
    case SupportedChain.ETHEREUM_MAINNET:
      return { id: 1 };
    case SupportedChain.ETHEREUM_SEPOLIA:
      return { id: 11155111 };
    case SupportedChain.POLYGON_MAINNET:
      return { id: 137 };
    case SupportedChain.POLYGON_MUMBAI:
      return { id: 80001 };
    case SupportedChain.BSC_MAINNET:
      return { id: 56 };
    case SupportedChain.BSC_TESTNET:
      return { id: 97 };
    case SupportedChain.ARBITRUM_MAINNET:
      return { id: 42161 };
    case SupportedChain.ARBITRUM_SEPOLIA:
      return { id: 421614 };
    case SupportedChain.OPTIMISM_MAINNET:
      return { id: 10 };
    case SupportedChain.OPTIMISM_SEPOLIA:
      return { id: 11155420 };
    case SupportedChain.BASE_MAINNET:
      return { id: 8453 };
    case SupportedChain.BASE_SEPOLIA:
      return { id: 84532 };
    case SupportedChain.BERACHAIN_MAINNET:
      return { id: 80094 };
    case SupportedChain.BERACHAIN_TESTNET:
      return { id: 80069 };
    case SupportedChain.ANVIL:
      return { id: 31337 };
    default:
      throw new DividendsError(`Unsupported chain: ${chain}`);
  }
}
