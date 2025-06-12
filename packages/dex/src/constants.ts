import { SupportedChain } from "@stratosphere-network/shared";

export const SMART_ROUTER_ADDRESS: Record<SupportedChain, string> = {
    [SupportedChain.BERACHAIN_MAINNET]: "0xfF7c752D360442d45b0416030E4F122bE5d0976C",
    [SupportedChain.BERACHAIN_TESTNET]: "0x278D7C0b8d11FE06CDEd387f718150962672a89d",
    [SupportedChain.ETHEREUM_MAINNET]: "",
    [SupportedChain.ETHEREUM_SEPOLIA]: "",
    [SupportedChain.POLYGON_MAINNET]: "",
    [SupportedChain.POLYGON_MUMBAI]: "",
    [SupportedChain.BSC_MAINNET]: "",
    [SupportedChain.BSC_TESTNET]: "",
    [SupportedChain.ARBITRUM_MAINNET]: "",
    [SupportedChain.ARBITRUM_SEPOLIA]: "",
    [SupportedChain.OPTIMISM_MAINNET]: "",
    [SupportedChain.OPTIMISM_SEPOLIA]: "",
    [SupportedChain.BASE_MAINNET]: "",
    [SupportedChain.BASE_SEPOLIA]: "",
}