import { privateKeyToAccount } from "viem/accounts";
import { Dividends } from "../index";
import { describe, expect, it, beforeEach } from "@jest/globals";
import {
  Account,
  createPublicClient,
  createWalletClient,
  formatUnits,
  http,
  parseUnits,
  PublicClient,
  WalletClient,
} from "viem";
import { MockUSDC_ABI, MockUSDC_BYTECODE } from "../artifacts/mockUSDC";
import { MockTokenA_ABI, MockTokenA_BYTECODE } from "../artifacts/mockTokenA";
import { MockTokenB_ABI, MockTokenB_BYTECODE } from "../artifacts/mockTokenB";
import {
  DividendContract_ABI,
  DividendContract_BYTECODE,
} from "../artifacts/dividendContract";
import { anvil } from "viem/chains";
import { ChildProcessWithoutNullStreams, execSync, spawn } from "child_process";
import {
  DividendFactoryContract_ABI,
  DividendFactoryContract_BYTECODE,
} from "../artifacts/dividendFactoryContract";
import { DividendsError } from "../error";
import { SupportedChain } from "../types";
import { Wallet } from "ethers";
import { getChain, getChainFromSupportedChain } from "../utils";

describe("Dividends", () => {
  const anvilPort = Math.floor(Math.random() * (15999 - 13001 + 1)) + 13001;
  const anvilRpcUrl = `http://localhost:${anvilPort}`;
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
  let factoryDividedAddress: string | `0x${string}`;

  let anvilAdminAccount: Account;
  let anvilAnotherAccount: Account;

  let anvilProcess: ChildProcessWithoutNullStreams | null = null;

  const ratioTokenA = [1, 2, 3, 5, 8].map((r) => parseUnits(r.toString(), 18));
  const ratioTokenB = [2, 1, 4, 7, 3].map((r) => parseUnits(r.toString(), 18));

  const distributeTokenA = async () => {
    for (let i = 0; i < ratioTokenA.length; i++) {
      {
        const { request: sendRequest } = await anvilClient.simulateContract({
          address: mockTokenAAddress as `0x${string}`,
          abi: MockTokenA_ABI,
          functionName: "transfer",
          args: [participantsWalletAddr[i] as `0x${string}`, ratioTokenA[i]],
          account: anvilAdminAccount,
        });

        await walletClient.writeContract({
          ...sendRequest,
        });
      }
    }
  };

  const distributeTokenB = async () => {
    for (let i = 0; i < ratioTokenB.length; i++) {
      {
        const { request: sendRequest } = await anvilClient.simulateContract({
          address: mockTokenBAddress as `0x${string}`,
          abi: MockTokenB_ABI,
          functionName: "transfer",
          args: [participantsWalletAddr[i] as `0x${string}`, ratioTokenB[i]],
          account: anvilAdminAccount,
        });

        await walletClient.writeContract({
          ...sendRequest,
        });
      }
    }
  };

  const usdcBalanceCheck = async (addresses: string[]) => {
    const task = [];
    for (const address of addresses) {
      task.push(
        anvilClient.readContract({
          address: mockUSDCAddress as `0x${string}`,
          abi: MockUSDC_ABI,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        })
      );
    }

    const balances = await Promise.all(task);
    return balances.map((b) => formatUnits(b, 6));
  };

  beforeAll(async () => {});

  beforeEach(async () => {
    // start anvil fist
    anvilProcess = spawn("anvil", ["--port", anvilPort.toString()]);

    // make sure connected to anvil rpc localhost with port 13519

    anvilAdminAccount = privateKeyToAccount(anvilAdminPK);
    anvilAnotherAccount = privateKeyToAccount(anvilAnotherPK);

    walletClient = createWalletClient({
      transport: http(anvilRpcUrl),
    });
    anvilClient = createPublicClient({
      // chain: anvil,
      transport: http(anvilRpcUrl),
    });

    // check if connected to anvil
    const balanceAdmin = await anvilClient.getBalance({
      address: anvilAdminAccount.address,
    });
    expect(balanceAdmin).toBeGreaterThan(0);

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
    const maxBatchSize = parseUnits("40", 0);

    const { request: initializeRequest } = await anvilClient.simulateContract({
      address: dividendAddress as `0x${string}`,
      abi: DividendContract_ABI,
      functionName: "initialize",
      args: [maxBatchSize, parseUnits("0", 18), anvilAdminAccount.address],
      account: anvilAdminAccount,
    });

    await walletClient.writeContract({
      ...initializeRequest,
    });

    // deploy dividend factory
    const divFactoryDeploymentTx = await walletClient.deployContract({
      abi: DividendFactoryContract_ABI,
      account: anvilAdminAccount,
      bytecode: DividendFactoryContract_BYTECODE,
      chain: anvilClient.chain,
      args: [],
    });

    const { contractAddress: factoryDivAddr } =
      await anvilClient.getTransactionReceipt({
        hash: divFactoryDeploymentTx,
      });

    factoryDividedAddress = factoryDivAddr?.toString() ?? "0x0";

    // deploy again dividend for factory init
    const _div2Tx = await walletClient.deployContract({
      abi: DividendContract_ABI,
      account: anvilAdminAccount,
      bytecode: DividendContract_BYTECODE,
      chain: anvilClient.chain,
      args: [],
    });

    const { contractAddress: _div2Addr } =
      await anvilClient.getTransactionReceipt({
        hash: _div2Tx,
      });

    // initialize dividend factory
    await walletClient.writeContract({
      address: factoryDividedAddress as `0x${string}`,
      abi: DividendFactoryContract_ABI,
      functionName: "initialize",
      args: [
        _div2Addr as `0x${string}`,
        parseUnits("0", 18),
        anvilAdminAccount.address,
      ],
      account: anvilAdminAccount,
      chain: anvilClient.chain,
    });

    // distribute token A to participants
    await distributeTokenA();

    // distribute token B to participants
    await distributeTokenB();
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
  });

  afterEach(async () => {
    if (anvilProcess) {
      anvilProcess.kill();

      // make sure anvil process is killed, check port is terminated
      try {
        execSync(`lsof -i:${anvilPort}`);
      } catch (e) {}
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
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

  it("check distribution to token A", async () => {
    // check balances of participants
    for (let i = 0; i < ratioTokenA.length; i++) {
      const balance = await anvilClient.readContract({
        address: mockTokenAAddress as `0x${string}`,
        abi: MockTokenA_ABI,
        functionName: "balanceOf",
        args: [participantsWalletAddr[i] as `0x${string}`],
      });
      expect(balance).toBe(ratioTokenA[i]);
    }
  });

  it("check distribution to token B", async () => {
    // check balances of participants
    for (let i = 0; i < ratioTokenB.length; i++) {
      const balance = await anvilClient.readContract({
        address: mockTokenBAddress as `0x${string}`,
        abi: MockTokenB_ABI,
        functionName: "balanceOf",
        args: [participantsWalletAddr[i] as `0x${string}`],
      });
      expect(balance).toBe(ratioTokenB[i]);
    }
  });

  it("check dividend manual, with private key", async () => {
    // check initial balances of usdc of participants
    const initialBalances = await usdcBalanceCheck(participantsWalletAddr);
    const wallet = new Wallet(anvilAdminPK);
    const dividend = new Dividends(SupportedChain.ANVIL, wallet, anvilClient, {
      id: 31337,
      rpcUrl: anvilRpcUrl,
    });

    const divAmount = 1000;
    const dividendResult = await dividend.distributeDividendManual({
      tokenAddress: mockTokenAAddress as `0x${string}`,
      stableCoinAddress: mockUSDCAddress as `0x${string}`,
      amount: divAmount, // assume we distribute dividend of 1000 usdc,
      indexer: async (tokenAddress, chain) => {
        const result = [];
        for (let i = 0; i < participantsWalletAddr.length; i++) {
          result.push({
            address: participantsWalletAddr[i],
            amount: ratioTokenA[i].toString(),
          });
        }

        return result;
      },
      businessLogic: async (params) => {
        const result: { address: string; amount: string }[] = [];

        const _totalTokenSupply = params.totalSupply;
        const _divAmount = params.dividendAmount;
        const totalTokenSupply = parseUnits(_totalTokenSupply, 0);
        const divAmount = parseUnits(_divAmount, 0);
        for (let i = 0; i < params.holders.length; i++) {
          const amountTokenOfMine = parseUnits(params.holders[i].amount, 0);
          const _ratio =
            (amountTokenOfMine * divAmount * parseUnits("10", 2)) /
            totalTokenSupply;

          // make sure ratio is not in decimal
          const ratio = _ratio.toString().split(".")[0];

          result.push({
            address: params.holders[i].address,
            amount: ratio,
          });
        }

        return result;
      },
    });

    // check usdc balance of participants
    const finalBalances = await usdcBalanceCheck(
      dividendResult.map((r) => r.address)
    );

    // check if final balances is greater than initial balances
    for (let i = 0; i < finalBalances.length; i++) {
      expect(parseUnits(finalBalances[i], 0)).toBeGreaterThan(
        parseUnits(initialBalances[i], 0)
      );
    }

    // check for tx type
    dividendResult.forEach((r) => {
      expect(r.type).toBe("signed");
    });

    // check for tx hash
    for (const r of dividendResult) {
      expect(r.txHash).toBeDefined();

      // get tx receipt
      const txReceipt = await anvilClient.getTransactionReceipt({
        hash: r.txHash as `0x${string}`,
      });
      expect(txReceipt).toBeDefined();
      expect(txReceipt?.status).toBe("success");
    }
  });

  it("check dividend automatic, with private key", async () => {
    // check initial balances of usdc of participants
    const initialBalances = await usdcBalanceCheck(participantsWalletAddr);
    const wallet = new Wallet(anvilAdminPK);
    const dividend = new Dividends(SupportedChain.ANVIL, wallet, anvilClient, {
      id: 31337,
      rpcUrl: anvilRpcUrl,
    });

    const divAmount = 1000;
    const dividendResult = await dividend.distributeDividend(
      {
        tokenAddress: mockTokenAAddress as `0x${string}`,
        stableCoinAddress: mockUSDCAddress as `0x${string}`,
        amount: divAmount, // assume we distribute dividend of 1000 usdc,
        indexer: async (tokenAddress, chain) => {
          const result = [];
          for (let i = 0; i < participantsWalletAddr.length; i++) {
            result.push({
              address: participantsWalletAddr[i],
              amount: ratioTokenA[i].toString(),
            });
          }

          return result;
        },
        businessLogic: async (params) => {
          const result: { address: string; amount: string }[] = [];

          const _totalTokenSupply = params.totalSupply;
          const _divAmount = params.dividendAmount;
          const totalTokenSupply = parseUnits(_totalTokenSupply, 0);
          const divAmount = parseUnits(_divAmount, 0);
          for (let i = 0; i < params.holders.length; i++) {
            const amountTokenOfMine = parseUnits(params.holders[i].amount, 0);
            const _ratio =
              (amountTokenOfMine * divAmount * parseUnits("10", 2)) /
              totalTokenSupply;

            // make sure ratio is not in decimal
            const ratio = _ratio.toString().split(".")[0];

            result.push({
              address: params.holders[i].address,
              amount: ratio,
            });
          }

          return result;
        },
      },
      dividendAddress,
      {
        title: "testtest",
        directTransfer: true,
      }
    );

    // check usdc balance of participants
    const finalBalances = await usdcBalanceCheck(
      dividendResult.dividendPortion.map((r) => r.address)
    );

    // check if final balances is greater than initial balances
    for (let i = 0; i < finalBalances.length; i++) {
      expect(parseUnits(finalBalances[i], 0)).toBeGreaterThan(
        parseUnits(initialBalances[i], 0)
      );
    }

    // check for tx type
    expect(dividendResult.type).toBe("signed");
    // check for tx hash
    expect(dividendResult.txHash).toBeDefined();

    // get tx receipt
    const txReceipt = await anvilClient.getTransactionReceipt({
      hash: dividendResult.txHash as `0x${string}`,
    });
    expect(txReceipt).toBeDefined();
    expect(txReceipt?.status).toBe("success");
  });

  it("check dividend automatic, with private key + off direct transfer success", async () => {
    // check initial balances of usdc of participants
    const initialBalances = await usdcBalanceCheck(participantsWalletAddr);
    const wallet = new Wallet(anvilAdminPK);
    const dividend = new Dividends(SupportedChain.ANVIL, wallet, anvilClient, {
      id: 31337,
      rpcUrl: anvilRpcUrl,
    });

    const divAmount = 1000;

    // send some usdc to contract  = divAmount
    const { request } = await anvilClient.simulateContract({
      address: mockUSDCAddress as `0x${string}`,
      abi: MockUSDC_ABI,
      functionName: "transfer",
      args: [
        dividendAddress as `0x${string}`,
        parseUnits(divAmount.toString(), 6),
      ],
      account: anvilAdminAccount,
    });

    const tx = await walletClient.writeContract({
      ...request,
    });
    const txReceipt0 = await anvilClient.getTransactionReceipt({
      hash: tx as `0x${string}`,
    });
    expect(txReceipt0?.status).toBe("success");

    const dividendResult = await dividend.distributeDividend(
      {
        tokenAddress: mockTokenAAddress as `0x${string}`,
        stableCoinAddress: mockUSDCAddress as `0x${string}`,
        amount: divAmount, // assume we distribute dividend of 1000 usdc,
        indexer: async (tokenAddress, chain) => {
          const result = [];
          for (let i = 0; i < participantsWalletAddr.length; i++) {
            result.push({
              address: participantsWalletAddr[i],
              amount: ratioTokenA[i].toString(),
            });
          }

          return result;
        },
        businessLogic: async (params) => {
          const result: { address: string; amount: string }[] = [];

          const _totalTokenSupply = params.totalSupply;
          const _divAmount = params.dividendAmount;
          const totalTokenSupply = parseUnits(_totalTokenSupply, 0);
          const divAmount = parseUnits(_divAmount, 0);
          for (let i = 0; i < params.holders.length; i++) {
            const amountTokenOfMine = parseUnits(params.holders[i].amount, 0);
            const _ratio =
              (amountTokenOfMine * divAmount * parseUnits("10", 2)) /
              totalTokenSupply;

            // make sure ratio is not in decimal
            const ratio = _ratio.toString().split(".")[0];

            result.push({
              address: params.holders[i].address,
              amount: ratio,
            });
          }

          return result;
        },
      },
      dividendAddress
    );

    // check usdc balance of participants
    const finalBalances = await usdcBalanceCheck(
      dividendResult.dividendPortion.map((r) => r.address)
    );

    // check if final balances is greater than initial balances
    for (let i = 0; i < finalBalances.length; i++) {
      expect(parseUnits(finalBalances[i], 0)).toBeGreaterThan(
        parseUnits(initialBalances[i], 0)
      );
    }

    // check for tx type
    expect(dividendResult.type).toBe("signed");
    // check for tx hash
    expect(dividendResult.txHash).toBeDefined();

    // get tx receipt
    const txReceipt = await anvilClient.getTransactionReceipt({
      hash: dividendResult.txHash as `0x${string}`,
    });
    expect(txReceipt).toBeDefined();
    expect(txReceipt?.status).toBe("success");
  });

  it("check dividend automatic, with private key + off direct transfer failure", async () => {
    // check initial balances of usdc of participants
    const wallet = new Wallet(anvilAdminPK);
    const dividend = new Dividends(SupportedChain.ANVIL, wallet, anvilClient, {
      id: 31337,
      rpcUrl: anvilRpcUrl,
    });

    const divAmount = 1000;
    expect(async () => {
      await dividend.distributeDividend(
        {
          tokenAddress: mockTokenAAddress as `0x${string}`,
          stableCoinAddress: mockUSDCAddress as `0x${string}`,
          amount: divAmount, // assume we distribute dividend of 1000 usdc,
          indexer: async (tokenAddress, chain) => {
            const result = [];
            for (let i = 0; i < participantsWalletAddr.length; i++) {
              result.push({
                address: participantsWalletAddr[i],
                amount: ratioTokenA[i].toString(),
              });
            }

            return result;
          },
          businessLogic: async (params) => {
            const result: { address: string; amount: string }[] = [];

            const _totalTokenSupply = params.totalSupply;
            const _divAmount = params.dividendAmount;
            const totalTokenSupply = parseUnits(_totalTokenSupply, 0);
            const divAmount = parseUnits(_divAmount, 0);
            for (let i = 0; i < params.holders.length; i++) {
              const amountTokenOfMine = parseUnits(params.holders[i].amount, 0);
              const _ratio =
                (amountTokenOfMine * divAmount * parseUnits("10", 2)) /
                totalTokenSupply;

              // make sure ratio is not in decimal
              const ratio = _ratio.toString().split(".")[0];

              result.push({
                address: params.holders[i].address,
                amount: ratio,
              });
            }

            return result;
          },
        },
        dividendAddress
      );
    }).rejects.toThrow();
  });

  it("check dividend factory", async () => {
    const wallet = new Wallet(anvilAdminPK);
    const dividend = new Dividends(SupportedChain.ANVIL, wallet, anvilClient, {
      id: 31337,
      rpcUrl: anvilRpcUrl,
    });

    // create new dividend contract through the factory
    const { request: createDividendRequest } =
      await anvilClient.simulateContract({
        address: factoryDividedAddress as `0x${string}`,
        abi: DividendFactoryContract_ABI,
        functionName: "create",
        args: [
          mockTokenAAddress as `0x${string}`,
          "mA",
          anvilAdminAccount.address,
        ],
        account: anvilAdminAccount,
      });

    const tx = await walletClient.writeContract({
      ...createDividendRequest,
    });

    const txReceipt = await anvilClient.getTransactionReceipt({
      hash: tx as `0x${string}`,
    });

    expect(txReceipt?.status).toBe("success");

    //get dividend address
    const _dividendAddr = await dividend.getDividendContractAddress(
      factoryDividedAddress as `0x${string}`,
      mockTokenAAddress
    );

    // check _dividendAddr and is hex and have length >25
    expect(_dividendAddr).toBeDefined();
    expect((_dividendAddr as string).startsWith("0x")).toBe(true);
    expect(_dividendAddr).toHaveLength(42);
  });

  it("check dividend factory and distribute dividend with contract that already created", async () => {
    const wallet = new Wallet(anvilAdminPK);
    const dividend = new Dividends(SupportedChain.ANVIL, wallet, anvilClient, {
      id: 31337,
      rpcUrl: anvilRpcUrl,
    });

    // create new dividend contract through the factory
    const { request: createDividendRequest } =
      await anvilClient.simulateContract({
        address: factoryDividedAddress as `0x${string}`,
        abi: DividendFactoryContract_ABI,
        functionName: "create",
        args: [
          mockTokenBAddress as `0x${string}`,
          "mBB",
          anvilAdminAccount.address,
        ],
        account: anvilAdminAccount,
      });

    const tx = await walletClient.writeContract({
      ...createDividendRequest,
    });

    const txReceipt = await anvilClient.getTransactionReceipt({
      hash: tx as `0x${string}`,
    });

    expect(txReceipt?.status).toBe("success");

    // get initial wallet
    const initialBalances = await usdcBalanceCheck(participantsWalletAddr);

    // try to distribute dividend
    const divAmount = 2500;
    const dividendResult = await dividend.distributeDividend(
      {
        tokenAddress: mockTokenBAddress as `0x${string}`,
        stableCoinAddress: mockUSDCAddress as `0x${string}`,
        amount: divAmount, // assume we distribute dividend of 1000 usdc,
        indexer: async (tokenAddress, chain) => {
          const result = [];
          for (let i = 0; i < participantsWalletAddr.length; i++) {
            result.push({
              address: participantsWalletAddr[i],
              amount: ratioTokenB[i].toString(),
            });
          }

          return result;
        },
        businessLogic: async (params) => {
          const result: { address: string; amount: string }[] = [];

          const _totalTokenSupply = params.totalSupply;
          const _divAmount = params.dividendAmount;
          const totalTokenSupply = parseUnits(_totalTokenSupply, 0);
          const divAmount = parseUnits(_divAmount, 0);
          for (let i = 0; i < params.holders.length; i++) {
            const amountTokenOfMine = parseUnits(params.holders[i].amount, 0);
            const _ratio =
              (amountTokenOfMine * divAmount * parseUnits("10", 2)) /
              totalTokenSupply;

            // make sure ratio is not in decimal
            const ratio = _ratio.toString().split(".")[0];

            result.push({
              address: params.holders[i].address,
              amount: ratio,
            });
          }

          return result;
        },
      },
      await dividend.getDividendContractAddress(
        factoryDividedAddress as `0x${string}`,
        mockTokenBAddress
      ),
      {
        title: "testtest",
        directTransfer: true,
      }
    );

    // check usdc balance of participants
    const finalBalances = await usdcBalanceCheck(
      dividendResult.dividendPortion.map((r) => r.address)
    );

    // check if final balances is greater than initial balances
    for (let i = 0; i < finalBalances.length; i++) {
      expect(parseUnits(finalBalances[i], 0)).toBeGreaterThan(
        parseUnits(initialBalances[i], 0)
      );
    }

    // check for tx type
    expect(dividendResult.type).toBe("signed");
    // check for tx hash
    expect(dividendResult.txHash).toBeDefined();

    // get tx receipt
    const txReceipt2 = await anvilClient.getTransactionReceipt({
      hash: dividendResult.txHash as `0x${string}`,
    });
    expect(txReceipt2).toBeDefined();
    expect(txReceipt2?.status).toBe("success");
  });

  // Test coverage for utils.ts functions
  describe("Utils functions", () => {
    describe("getChainFromSupportedChain", () => {
      it("should return correct chain IDs for all supported chains", () => {
        expect(
          getChainFromSupportedChain(SupportedChain.ETHEREUM_MAINNET)
        ).toEqual({ id: 1 });
        expect(
          getChainFromSupportedChain(SupportedChain.ETHEREUM_SEPOLIA)
        ).toEqual({ id: 11155111 });
        expect(
          getChainFromSupportedChain(SupportedChain.POLYGON_MAINNET)
        ).toEqual({ id: 137 });
        expect(
          getChainFromSupportedChain(SupportedChain.POLYGON_MUMBAI)
        ).toEqual({ id: 80001 });
        expect(getChainFromSupportedChain(SupportedChain.BSC_MAINNET)).toEqual({
          id: 56,
        });
        expect(getChainFromSupportedChain(SupportedChain.BSC_TESTNET)).toEqual({
          id: 97,
        });
        expect(
          getChainFromSupportedChain(SupportedChain.ARBITRUM_MAINNET)
        ).toEqual({ id: 42161 });
        expect(
          getChainFromSupportedChain(SupportedChain.ARBITRUM_SEPOLIA)
        ).toEqual({ id: 421614 });
        expect(
          getChainFromSupportedChain(SupportedChain.OPTIMISM_MAINNET)
        ).toEqual({ id: 10 });
        expect(
          getChainFromSupportedChain(SupportedChain.OPTIMISM_SEPOLIA)
        ).toEqual({ id: 11155420 });
        expect(getChainFromSupportedChain(SupportedChain.BASE_MAINNET)).toEqual(
          { id: 8453 }
        );
        expect(getChainFromSupportedChain(SupportedChain.BASE_SEPOLIA)).toEqual(
          { id: 84532 }
        );
        expect(
          getChainFromSupportedChain(SupportedChain.BERACHAIN_MAINNET)
        ).toEqual({ id: 80094 });
        expect(
          getChainFromSupportedChain(SupportedChain.BERACHAIN_TESTNET)
        ).toEqual({ id: 80069 });
        expect(getChainFromSupportedChain(SupportedChain.ANVIL)).toEqual({
          id: 31337,
        });
      });

      it("should throw error for unsupported chain", () => {
        expect(() => {
          getChainFromSupportedChain("UNSUPPORTED_CHAIN" as SupportedChain);
        }).toThrow(DividendsError);
      });
    });

    describe("getChain", () => {
      it("should return correct viem chains for known chain IDs", () => {
        // Test mainnet
        const mainnetChain = getChain({ id: 1 });
        expect(mainnetChain.id).toBe(1);
        expect(mainnetChain.name).toBe("Ethereum");

        // Test polygon
        const polygonChain = getChain({ id: 137 });
        expect(polygonChain.id).toBe(137);
        expect(polygonChain.name).toBe("Polygon");

        // Test base
        const baseChain = getChain({ id: 8453 });
        expect(baseChain.id).toBe(8453);
        expect(baseChain.name).toBe("Base");

        // Test arbitrum
        const arbitrumChain = getChain({ id: 42161 });
        expect(arbitrumChain.id).toBe(42161);
        expect(arbitrumChain.name).toBe("Arbitrum One");

        // Test optimism
        const optimismChain = getChain({ id: 10 });
        expect(optimismChain.id).toBe(10);
        expect(optimismChain.name).toBe("OP Mainnet");

        // Test base sepolia
        const baseSepoliaChain = getChain({ id: 84532 });
        expect(baseSepoliaChain.id).toBe(84532);
        expect(baseSepoliaChain.name).toBe("Base Sepolia");

        // Test berachain
        const berachainChain = getChain({ id: 80094 });
        expect(berachainChain.id).toBe(80094);

        // Test berachain testnet
        const berachainTestnetChain = getChain({ id: 80069 });
        expect(berachainTestnetChain.id).toBe(80069);

        // Test sepolia
        const sepoliaChain = getChain({ id: 11155111 });
        expect(sepoliaChain.id).toBe(11155111);

        // Test anvil
        const anvilChain = getChain({ id: 31337 });
        expect(anvilChain.id).toBe(31337);
        expect(anvilChain.name).toBe("Anvil");
      });

      it("should create custom chain when RPC URL is provided", () => {
        const customChain = getChain({
          id: 999999,
          rpcUrl: "https://custom-rpc.example.com",
        });

        expect(customChain.id).toBe(999999);
        expect(customChain.name).toBe("Custom");
        expect(customChain.nativeCurrency).toEqual({
          decimals: 18,
          name: "Ether",
          symbol: "ETH",
        });
        expect(customChain.rpcUrls.default.http[0]).toBe(
          "https://custom-rpc.example.com"
        );
      });

      it("should throw error for unknown chain ID without RPC URL", () => {
        expect(() => {
          getChain({ id: 999999 });
        }).toThrow(DividendsError);

        expect(() => {
          getChain({ id: 999999 });
        }).toThrow("No id match for chain, RPC URL is required");
      });

      it("should handle edge cases properly", () => {
        // Test with undefined rpcUrl (should throw)
        expect(() => {
          getChain({ id: 999999, rpcUrl: undefined });
        }).toThrow(DividendsError);

        // Test with empty string rpcUrl (should throw)
        expect(() => {
          getChain({ id: 999999, rpcUrl: "" });
        }).toThrow(DividendsError);
      });
    });
  });
});
