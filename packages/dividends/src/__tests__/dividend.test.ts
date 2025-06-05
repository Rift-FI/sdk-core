import { privateKeyToAccount } from "viem/accounts";
import { Dividends } from "../dividend";
import { Chain } from "../types";
import { describe, expect, it, beforeEach } from "@jest/globals";
import {
  Account,
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  PublicClient,
  WalletClient,
} from "viem";
import { MockUSDC_ABI, MockUSDC_BYTECODE } from "../artifacts/mockUSDC";
import { getTransactionReceipt } from "viem/_types/actions/public/getTransactionReceipt";
import { MockTokenA_ABI, MockTokenA_BYTECODE } from "../artifacts/mockTokenA";
import { MockTokenB_ABI, MockTokenB_BYTECODE } from "../artifacts/mockTokenB";
import {
  DividendContract_ABI,
  DividendContract_BYTECODE,
} from "../artifacts/dividendContract";
import { anvil } from "viem/chains";

describe("Dividends", () => {
  const anvilRpcUrl = "http://localhost:13519";
  const anvilAdminPK =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const anvilAnotherPK =
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

  const participantsWalletAddr = [
    "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  ];

  let walletClient: WalletClient;
  let anvilClient: PublicClient;

  let mockUSDCAddress: string | `0x${string}`;
  let mockTokenAAddress: string | `0x${string}`;
  let mockTokenBAddress: string | `0x${string}`;
  let dividendAddress: string | `0x${string}`;

  let anvilAdminAccount: Account;
  let anvilAnotherAccount: Account;

  beforeEach(async () => {
    // make sure connected to anvil rpc localhost with port 13519

    anvilAdminAccount = privateKeyToAccount(anvilAdminPK);
    anvilAnotherAccount = privateKeyToAccount(anvilAnotherPK);

    walletClient = createWalletClient({
      transport: http(anvilRpcUrl),
    });
    anvilClient = createPublicClient({
      chain: anvil,
      transport: http(anvilRpcUrl),
    });

    // check if connected to anvil
    const balance = await anvilClient.getBalance({
      address: anvilAdminAccount.address,
    });
    expect(balance).toBeGreaterThan(0);

    // deploy smart contracts of mockUSDC, mockTokenA, mockTokenB, Dividend
    const mockUSDCDeploymentTx = await walletClient.deployContract({
      abi: MockUSDC_ABI,
      account: anvilAdminAccount,
      bytecode: MockUSDC_BYTECODE,
      chain: anvilClient.chain,
      args: [],
    });

    // we will retrieve the address of the deployed contract
    const { contractAddress: usdcContractAddr } =
      await anvilClient.getTransactionReceipt({
        hash: mockUSDCDeploymentTx,
      });
    mockUSDCAddress = usdcContractAddr?.toString() ?? "0x0";

    // deploy mockTokenA
    const mockTokenADeploymentTx = await walletClient.deployContract({
      abi: MockTokenA_ABI,
      account: anvilAdminAccount,
      bytecode: MockTokenA_BYTECODE,
      chain: anvilClient.chain,
    });

    const { contractAddress: tokenAContractAddr } =
      await anvilClient.getTransactionReceipt({
        hash: mockTokenADeploymentTx,
      });
    mockTokenAAddress = tokenAContractAddr?.toString() ?? "0x0";

    // deploy mockTokenB
    const mockTokenBDeploymentTx = await walletClient.deployContract({
      abi: MockTokenB_ABI,
      account: anvilAdminAccount,
      bytecode: MockTokenB_BYTECODE,
      chain: anvilClient.chain,
    });

    const { contractAddress: tokenBContractAddr } =
      await anvilClient.getTransactionReceipt({
        hash: mockTokenBDeploymentTx,
      });
    mockTokenBAddress = tokenBContractAddr?.toString() ?? "0x0";

    // deploy Dividend
    const dividendDeploymentTx = await walletClient.deployContract({
      abi: DividendContract_ABI,
      account: anvilAdminAccount,
      bytecode: DividendContract_BYTECODE,
      chain: anvilClient.chain,
      args: [],
    });

    const { contractAddress: dividendContractAddr } =
      await anvilClient.getTransactionReceipt({
        hash: dividendDeploymentTx,
      });
    dividendAddress = dividendContractAddr?.toString() ?? "0x0";

    // call dividend initialize function
    const maxBatchSize = parseUnits("40", 1);

    const { request: initializeRequest } = await anvilClient.simulateContract({
      address: dividendAddress as `0x${string}`,
      abi: DividendContract_ABI,
      functionName: "initialize",
      args: [maxBatchSize],
      account: anvilAdminAccount,
    });

    await walletClient.writeContract({
      ...initializeRequest,
    });
  });

  it("check token balances", async () => {
    // check balances of mockUSDC, mockTokenA, mockTokenB
    // if admin should more than 5_000
    // if another account should be zero

    const [
      mockUSDCAdminBalance,
      mockUSDCAnotherBalance,
      mockTokenAAdminBalance,
      mockTokenAAnotherBalance,
      mockTokenBAdminBalance,
      mockTokenBAnotherBalance,
    ] = await Promise.all([
      // mockUSDC balances
      anvilClient.readContract({
        address: mockUSDCAddress as `0x${string}`,
        abi: MockUSDC_ABI,
        functionName: "balanceOf",
        args: [anvilAdminAccount.address],
      }),
      anvilClient.readContract({
        address: mockUSDCAddress as `0x${string}`,
        abi: MockUSDC_ABI,
        functionName: "balanceOf",
        args: [anvilAnotherAccount.address],
      }),
      // mockTokenA balances
      anvilClient.readContract({
        address: mockTokenAAddress as `0x${string}`,
        abi: MockTokenA_ABI,
        functionName: "balanceOf",
        args: [anvilAdminAccount.address],
      }),
      anvilClient.readContract({
        address: mockTokenAAddress as `0x${string}`,
        abi: MockTokenA_ABI,
        functionName: "balanceOf",
        args: [anvilAnotherAccount.address],
      }),
      // mockTokenB balances
      anvilClient.readContract({
        address: mockTokenBAddress as `0x${string}`,
        abi: MockTokenB_ABI,
        functionName: "balanceOf",
        args: [anvilAdminAccount.address],
      }),
      anvilClient.readContract({
        address: mockTokenBAddress as `0x${string}`,
        abi: MockTokenB_ABI,
        functionName: "balanceOf",
        args: [anvilAnotherAccount.address],
      }),
    ]);

    // More readable assertions
    expect(mockUSDCAdminBalance).toBeGreaterThan(parseUnits("5000", 6));
    expect(mockUSDCAnotherBalance).toBe(0n);
    expect(mockTokenAAdminBalance).toBeGreaterThan(parseUnits("5000", 18));
    expect(mockTokenAAnotherBalance).toBe(0n);
    expect(mockTokenBAdminBalance).toBeGreaterThan(parseUnits("5000", 18));
    expect(mockTokenBAnotherBalance).toBe(0n);
  });
});
