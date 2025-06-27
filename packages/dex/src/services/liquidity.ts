import { ethers } from "ethers";
import { BigintIsh, CurrencyAmount, Percent, Token } from "@stratospherex/sdk";
import { FeeAmount } from "@stratospherex/v3-sdk";
import { encodeFunctionData, parseAbi, PublicClient } from "viem";
import {
  PANCAKESWAP_V3_FACTORY_ADDRESS,
  PANCAKESWAP_V3_POSITION_MANAGER_ADDRESS,
  SMART_ROUTER_ADDRESS,
} from "../constants";
import { SupportedChain, Tx } from "../types/chains";
import {
  AddLiquidityParams,
  EstimatedLiquidity,
  IncreaseLiquidityParams,
} from "../types";
import { POSITION_MANAGER_ABI } from "../abi/position-manager.abi";

// PancakeSwap V3 NonfungiblePositionManager ABI (partial)
// const POSITION_MANAGER_ABI = parseAbi([
//   "function createAndInitializePoolIfNecessary(address tokenA, address tokenB, uint24 fee, uint160 sqrtPriceX96) external returns (address pool)",
//   "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
//   "function increaseLiquidity((uint256 tokenId, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external returns (uint128 liquidity, uint256 amount0, uint256 amount1)",
//   "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)"
// ]);

// PancakeSwap V3 Pool ABI (partial)
const POOL_ABI = parseAbi([
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function fee() external view returns (uint24)",
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
]);

// PancakeSwap V3 Factory ABI (partial)
const FACTORY_ABI = parseAbi([
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
]);

// Common fee tiers in PancakeSwap V3
const FEE_TIERS = [
  FeeAmount.LOWEST, // 0.01%
  FeeAmount.LOW, // 0.05%
  FeeAmount.MEDIUM, // 0.3%
  FeeAmount.HIGH, // 1%
];

export class LiquidityService {
  private viemClient: PublicClient;
  private chain: SupportedChain;

  constructor(chain: SupportedChain, viemClient: PublicClient) {
    this.chain = chain;
    this.viemClient = viemClient;
  }

  /**
   * Get token details from chain
   */
  async getToken(address: string): Promise<Token> {
    const chainId = await this.viemClient.getChainId();

    const abis = parseAbi([
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function name() view returns (string)",
    ]);
    const results = await this.viemClient.multicall({
      contracts: [
        {
          address: address as `0x${string}`,
          abi: abis,
          functionName: "symbol",
        },
        {
          address: address as `0x${string}`,
          abi: abis,
          functionName: "decimals",
        },
        {
          address: address as `0x${string}`,
          abi: abis,
          functionName: "name",
        },
      ],
    });
    const [symbol, decimals, name] = results;

    return new Token(
      Number(chainId),
      address as `0x${string}`,
      Number(decimals.result),
      name?.result as string,
      symbol?.result as string
    );
  }

  /**
   * Find the best pool for the token pair
   */
  private async findBestPool(
    tokenA: Token,
    tokenB: Token
  ): Promise<{ poolAddress: string; fee: FeeAmount } | null> {
    // Get PancakeSwap V3 factory address for the current chain
    const factoryAddress = PANCAKESWAP_V3_FACTORY_ADDRESS[this.chain];

    if (!factoryAddress) {
      throw new Error(`PancakeSwap V3 is not supported on chain ${this.chain}`);
    }

    // Sort tokens by address to match PancakeSwap's convention
    const [token0, token1] =
      tokenA.address.toLowerCase() < tokenB.address.toLowerCase()
        ? [tokenA, tokenB]
        : [tokenB, tokenA];

    // Check if pools exist for different fee tiers
    for (const fee of FEE_TIERS) {
      try {
        const poolAddress = await this.viemClient.readContract({
          address: factoryAddress as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: "getPool",
          args: [token0.address, token1.address, fee],
        });

        if (poolAddress && poolAddress !== ethers.ZeroAddress) {
          return { poolAddress: poolAddress as string, fee };
        }
      } catch (error) {
        console.error(`Error checking pool for fee ${fee}:`, error);
      }
    }

    // If no pool exists, return null
    return null;
  }

  /**
   * Check if tokens are approved for the position manager
   */
  async checkApproval(
    tokenAddress: string,
    walletAddress: string
  ): Promise<boolean> {
    const positionManagerAddress =
      PANCAKESWAP_V3_POSITION_MANAGER_ADDRESS[this.chain];

    if (!positionManagerAddress) {
      throw new Error(`PancakeSwap V3 is not supported on chain ${this.chain}`);
    }

    const token = await this.getToken(tokenAddress);
    const allowance = await this.viemClient.readContract({
      address: token.address,
      abi: parseAbi([
        "function allowance(address, address) view returns (uint256)",
      ]),
      functionName: "allowance",
      args: [
        walletAddress as `0x${string}`,
        positionManagerAddress as `0x${string}`,
      ],
    });

    return allowance > 0;
  }

  /**
   * Generate approve token transaction
   */
  async approve(tokenAddress: string, amount: string): Promise<any> {
    const positionManagerAddress =
      PANCAKESWAP_V3_POSITION_MANAGER_ADDRESS[this.chain];

    if (!positionManagerAddress) {
      throw new Error(`PancakeSwap V3 is not supported on chain ${this.chain}`);
    }

    const token = await this.getToken(tokenAddress);
    const data = encodeFunctionData({
      abi: parseAbi([
        "function approve(address, uint256) public returns (bool)",
      ]),
      functionName: "approve",
      args: [
        positionManagerAddress as `0x${string}`,
        ethers.parseUnits(amount, token.decimals),
      ],
    });

    return {
      to: token.address,
      data: data,
    };
  }

  /**
   * Estimate adding liquidity
   */
  async estimateAddLiquidity(
    params: AddLiquidityParams
  ): Promise<EstimatedLiquidity> {
    const { tokenA, tokenB, amountA, amountB } = params;

    const tokenAObj = await this.getToken(tokenA);
    const tokenBObj = await this.getToken(tokenB);

    // Find the best pool or create a new one
    const poolInfo = await this.findBestPool(tokenAObj, tokenBObj);

    let poolAddress: string;
    let fee: FeeAmount;

    if (poolInfo) {
      // Use existing pool
      poolAddress = poolInfo.poolAddress;
      fee = poolInfo.fee;
    } else {
      // Default to medium fee if no pool exists
      fee = FeeAmount.MEDIUM;
      poolAddress = "Pool will be created";
    }

    return {
      poolAddress,
      fee: Number(fee) / 10000, // Convert to percentage
      tokenAAmount: amountA,
      tokenBAmount: amountB,
    };
  }

  /**
   * Add liquidity to PancakeSwap V3 pool
   */
  async addLiquidity(
    params: AddLiquidityParams,
    walletAddress: string
  ): Promise<any> {
    const { tokenA, tokenB, amountA, amountB } = params;
    const positionManagerAddress =
      PANCAKESWAP_V3_POSITION_MANAGER_ADDRESS[this.chain];

    if (!positionManagerAddress) {
      throw new Error(`PancakeSwap V3 is not supported on chain ${this.chain}`);
    }

    const tokenAObj = await this.getToken(tokenA);
    const tokenBObj = await this.getToken(tokenB);

    // Sort tokens by address to match PancakeSwap's convention
    const [token0, token1] =
      tokenAObj.address.toLowerCase() < tokenBObj.address.toLowerCase()
        ? [tokenAObj, tokenBObj]
        : [tokenBObj, tokenAObj];

    const [amount0Desired, amount1Desired] =
      tokenAObj.address.toLowerCase() < tokenBObj.address.toLowerCase()
        ? [amountA, amountB]
        : [amountB, amountA];

    // Find or create pool
    const poolInfo = await this.findBestPool(tokenAObj, tokenBObj);
    const fee = poolInfo?.fee || FeeAmount.MEDIUM;

    // Parse amounts with proper decimals
    const parsedAmount0 = ethers.parseUnits(amount0Desired, token0.decimals);
    const parsedAmount1 = ethers.parseUnits(amount1Desired, token1.decimals);

    // If pool doesn't exist, we need to create it first
    let calldata: `0x${string}`;

    if (!poolInfo) {
      // Create pool with initial price derived from token amounts
      // This is a simplified approach - in production, you'd want to calculate a more precise price
      const sqrtPriceX96 = BigInt("0x1000000000000000000000000"); // Default price of 1:1

      const createPoolData = encodeFunctionData({
        abi: POSITION_MANAGER_ABI,
        functionName: "createAndInitializePoolIfNecessary",
        args: [
          token0.address as `0x${string}`,
          token1.address as `0x${string}`,
          fee,
          sqrtPriceX96,
        ],
      });

      // Add liquidity after pool creation
      calldata = createPoolData;
    } else {
      // Add liquidity to existing pool
      const mintParams = {
        token0: token0.address as `0x${string}`,
        token1: token1.address as `0x${string}`,
        fee: fee,
        tickLower: -887270,
        tickUpper: 887270,
        amount0Desired: parsedAmount1,
        amount1Desired: parsedAmount0,
        amount0Min: 0n,
        amount1Min: 0n,
        recipient: walletAddress as `0x${string}`,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
      };

      calldata = encodeFunctionData({
        abi: POSITION_MANAGER_ABI,
        functionName: "mint",
        args: [mintParams],
      });
    }

    return {
      account: walletAddress as `0x${string}`,
      to: positionManagerAddress as `0x${string}`,
      data: calldata,
      value: 0n,
    };
  }

  /**
   * Get position information by tokenId
   */
  async getPosition(tokenId: number): Promise<{
    token0: string;
    token1: string;
    fee: number;
    tickLower: number;
    tickUpper: number;
    liquidity: bigint;
  }> {
    const positionManagerAddress =
      PANCAKESWAP_V3_POSITION_MANAGER_ADDRESS[this.chain];

    if (!positionManagerAddress) {
      throw new Error(`PancakeSwap V3 is not supported on chain ${this.chain}`);
    }

    try {
      const position = (await this.viemClient.readContract({
        address: positionManagerAddress as `0x${string}`,
        abi: POSITION_MANAGER_ABI,
        functionName: "positions",
        args: [BigInt(tokenId)],
      })) as any;

      return {
        token0: position[2] as string,
        token1: position[3] as string,
        fee: Number(position[4]),
        tickLower: Number(position[5]),
        tickUpper: Number(position[6]),
        liquidity: position[7] as bigint,
      };
    } catch (error) {
      throw new Error(`Failed to get position information: ${error}`);
    }
  }

  /**
   * Estimate increasing liquidity for an existing position
   */
  async estimateIncreaseLiquidity(
    params: IncreaseLiquidityParams
  ): Promise<EstimatedLiquidity> {
    const { tokenId, amountA, amountB } = params;

    // Get position information
    const position = await this.getPosition(tokenId);

    // Get token objects
    const token0 = await this.getToken(position.token0);
    const token1 = await this.getToken(position.token1);

    return {
      poolAddress: `Position ID: ${tokenId}`,
      fee: Number(position.fee) / 10000, // Convert to percentage
      tokenAAmount: amountA,
      tokenBAmount: amountB,
    };
  }

  /**
   * Increase liquidity for an existing position
   */
  async increaseLiquidity(
    params: IncreaseLiquidityParams,
    walletAddress: string
  ): Promise<Tx> {
    const { tokenId, amountA, amountB } = params;
    const positionManagerAddress =
      PANCAKESWAP_V3_POSITION_MANAGER_ADDRESS[this.chain];

    if (!positionManagerAddress) {
      throw new Error(`PancakeSwap V3 is not supported on chain ${this.chain}`);
    }

    // Get position information
    const position = await this.getPosition(tokenId);

    // Get token objects
    const token0 = await this.getToken(position.token0);
    const token1 = await this.getToken(position.token1);

    // Determine which amount corresponds to which token
    let amount0Desired: bigint;
    let amount1Desired: bigint;

    if (token0.address.toLowerCase() === position.token0.toLowerCase()) {
      amount0Desired = ethers.parseUnits(amountA, token0.decimals);
      amount1Desired = ethers.parseUnits(amountB, token1.decimals);
    } else {
      amount0Desired = ethers.parseUnits(amountB, token0.decimals);
      amount1Desired = ethers.parseUnits(amountA, token1.decimals);
    }

    // Prepare increase liquidity parameters
    const increaseLiquidityParams = {
      tokenId: BigInt(tokenId),
      amount0Desired,
      amount1Desired,
      amount0Min: 0n, // No slippage protection for simplicity
      amount1Min: 0n, // No slippage protection for simplicity
      deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour deadline
    };

    // Encode function call
    const calldata = encodeFunctionData({
      abi: POSITION_MANAGER_ABI,
      functionName: "increaseLiquidity",
      args: [increaseLiquidityParams],
    });

    return {
      account: walletAddress as `0x${string}`,
      to: positionManagerAddress as `0x${string}`,
      data: calldata,
      value: 0n,
    };
  }
}
