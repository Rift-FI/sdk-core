import { Chain, defineChain } from "viem";
import {
  mainnet,
  sepolia,
  polygon,
  polygonMumbai,
  bsc,
  bscTestnet,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  optimism,
  optimismSepolia,
} from "viem/chains";

// Chain definitions
export enum SupportedChain {
  ETHEREUM_MAINNET = "ethereum-mainnet",
  ETHEREUM_SEPOLIA = "ethereum-sepolia",
  POLYGON_MAINNET = "polygon-mainnet",
  POLYGON_MUMBAI = "polygon-mumbai",
  BSC_MAINNET = "bsc-mainnet",
  BSC_TESTNET = "bsc-testnet",
  ARBITRUM_MAINNET = "arbitrum-mainnet",
  ARBITRUM_SEPOLIA = "arbitrum-sepolia",
  OPTIMISM_MAINNET = "optimism-mainnet",
  OPTIMISM_SEPOLIA = "optimism-sepolia",
  BASE_MAINNET = "base-mainnet",
  BASE_SEPOLIA = "base-sepolia",
  BERACHAIN_MAINNET = "berachain-mainnet",
  BERACHAIN_TESTNET = "berachain-testnet",
}

// Chain configuration
export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Chain configurations map
export const CHAIN_CONFIGS: Record<SupportedChain, ChainConfig> = {
  [SupportedChain.ETHEREUM_MAINNET]: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://ethereum.publicnode.com",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  [SupportedChain.ETHEREUM_SEPOLIA]: {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    rpcUrl: "https://ethereum-sepolia.publicnode.com",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "SepoliaETH",
      decimals: 18,
    },
  },
  [SupportedChain.POLYGON_MAINNET]: {
    chainId: 137,
    name: "Polygon Mainnet",
    rpcUrl: "https://polygon.llamarpc.com",
    blockExplorer: "https://polygonscan.com",
    nativeCurrency: { name: "Polygon", symbol: "MATIC", decimals: 18 },
  },
  [SupportedChain.POLYGON_MUMBAI]: {
    chainId: 80001,
    name: "Polygon Mumbai",
    rpcUrl: "https://rpc-mumbai.maticvigil.com",
    blockExplorer: "https://mumbai.polygonscan.com",
    nativeCurrency: { name: "Mumbai MATIC", symbol: "MATIC", decimals: 18 },
  },
  [SupportedChain.BSC_MAINNET]: {
    chainId: 56,
    name: "BSC Mainnet",
    rpcUrl: "https://bsc-dataseed1.binance.org",
    blockExplorer: "https://bscscan.com",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  },
  [SupportedChain.BSC_TESTNET]: {
    chainId: 97,
    name: "BSC Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    blockExplorer: "https://testnet.bscscan.com",
    nativeCurrency: { name: "Test BNB", symbol: "tBNB", decimals: 18 },
  },
  [SupportedChain.ARBITRUM_MAINNET]: {
    chainId: 42161,
    name: "Arbitrum One",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  [SupportedChain.ARBITRUM_SEPOLIA]: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia.arbiscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  [SupportedChain.OPTIMISM_MAINNET]: {
    chainId: 10,
    name: "Optimism",
    rpcUrl: "https://mainnet.optimism.io",
    blockExplorer: "https://optimistic.etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  [SupportedChain.OPTIMISM_SEPOLIA]: {
    chainId: 11155420,
    name: "Optimism Sepolia",
    rpcUrl: "https://sepolia.optimism.io",
    blockExplorer: "https://sepolia-optimism.etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  [SupportedChain.BASE_MAINNET]: {
    chainId: 8453,
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  [SupportedChain.BASE_SEPOLIA]: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  [SupportedChain.BERACHAIN_MAINNET]: {
    chainId: 80094,
    name: "Berachain",
    rpcUrl: "https://rpc.berachain.com/",
    blockExplorer: "https://berascan.com/",
    nativeCurrency: { name: "BERA", symbol: "BERA", decimals: 18 },
  },
  [SupportedChain.BERACHAIN_TESTNET]: {
    chainId: 289,
    name: "Berachain Bepolia",
    rpcUrl: "https://bepolia.rpc.berachain.com/",
    blockExplorer: "https://bepolia.beratrail.io/",
    nativeCurrency: { name: "BERA", symbol: "BERA", decimals: 18 },
  },
};

// Viem public client chains
export const ViemPublicClientChains: Record<SupportedChain, Chain> = {
  [SupportedChain.ETHEREUM_MAINNET]: mainnet,
  [SupportedChain.ETHEREUM_SEPOLIA]: sepolia,
  [SupportedChain.POLYGON_MAINNET]: polygon,
  [SupportedChain.POLYGON_MUMBAI]: polygonMumbai,
  [SupportedChain.BSC_MAINNET]: bsc,
  [SupportedChain.BSC_TESTNET]: bscTestnet,
  [SupportedChain.ARBITRUM_MAINNET]: arbitrum,
  [SupportedChain.ARBITRUM_SEPOLIA]: arbitrumSepolia,
  [SupportedChain.OPTIMISM_MAINNET]: optimism,
  [SupportedChain.OPTIMISM_SEPOLIA]: optimismSepolia,
  [SupportedChain.BASE_MAINNET]: base,
  [SupportedChain.BASE_SEPOLIA]: baseSepolia,
  [SupportedChain.BERACHAIN_MAINNET]: defineChain( {
    id: 80094,
    network: "berachain",
    name: "Berachain",
    nativeCurrency: { name: "BERA", symbol: "BERA", decimals: 18 },
    rpcUrls: {
      default: {
        http: ["https://rpc.berachain.com/"],
      },
      public: {
        http: ["https://rpc.berachain.com/"],
      },
    },
    blockExplorers: {
      default: {
        name: "Berascan",
        url: "https://berascan.com/",
      },
    },
    testnet: false,
    sourceId: 80094, // berachain
  }),
  [SupportedChain.BERACHAIN_TESTNET]: defineChain( {
    id: 80069,
    network: "berachain-bepolia",
    name: "Berachain Bepolia",
    nativeCurrency: { name: "BERA", symbol: "BERA", decimals: 18 },
    rpcUrls: {
      default: {
        http: ["https://bepolia.rpc.berachain.com/"],
      },
      public: {
        http: ["https://bepolia.rpc.berachain.com/"],
      },
    },
    blockExplorers: {
      default: {
        name: "Beratrail",
        url: "https://bepolia.beratrail.io/",
      },
    },
    testnet: true,
    sourceId: 80069, // berachain
  }),
};
