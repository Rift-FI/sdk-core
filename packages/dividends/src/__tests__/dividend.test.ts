import { privateKeyToAccount } from "viem/accounts";
import { Dividends } from "../dividend";
import { Chain } from "../types";
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
import { getTransactionReceipt } from "viem/_types/actions/public/getTransactionReceipt";
import { MockTokenA_ABI, MockTokenA_BYTECODE } from "../artifacts/mockTokenA";
import { MockTokenB_ABI, MockTokenB_BYTECODE } from "../artifacts/mockTokenB";
import {
  DividendContract_ABI,
  DividendContract_BYTECODE,
} from "../artifacts/dividendContract";
import { anvil } from "viem/chains";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

describe("Dividends", () => {
  const anvilRpcUrl = "http://localhost:13517";
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

  beforeAll(async () => {
    // start anvil fist
    anvilProcess = spawn("anvil", ["--port", "13517"]);

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
    const maxBatchSize = parseUnits("40", 0);

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

    // distribute token A to participants
    await distributeTokenA();

    // distribute token B to participants
    await distributeTokenB();
  });

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
  });

  afterAll(() => {
    if (anvilProcess) {
      anvilProcess.kill();
    }
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
    const dividend = new Dividends(
      {
        id: 31337,
        rpcUrl: anvilRpcUrl,
      },
      anvilAdminPK
    );

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
    const dividend = new Dividends(
      {
        id: 31337,
        rpcUrl: anvilRpcUrl,
      },
      anvilAdminPK
    );

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

  it("check dividend manual, with NO private key", async () => {
    // check initial balances of usdc of participants
    const initialBalances = await usdcBalanceCheck(participantsWalletAddr);
    const dividend = new Dividends(
      {
        id: 31337,
        rpcUrl: anvilRpcUrl,
      },
      anvilAdminAccount.address
    );

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

    // check for tx type
    dividendResult.forEach((r) => {
      expect(r.type).toBe("unsigned");
    });
  });

  it("check dividend automatic, with NO private key", async () => {
    // check initial balances of usdc of participants
    const initialBalances = await usdcBalanceCheck(participantsWalletAddr);
    const dividend = new Dividends(
      {
        id: 31337,
        rpcUrl: anvilRpcUrl,
      },
      anvilAdminAccount.address
    );

    const divAmount = 1000;

    // transfer stable coin to dividend contract
    const { request: transferRequest } = await anvilClient.simulateContract({
      address: mockUSDCAddress as `0x${string}`,
      abi: MockUSDC_ABI,
      functionName: "transfer",
      args: [
        dividendAddress as `0x${string}`,
        parseUnits(divAmount.toString(), 6),
      ],
      account: anvilAdminAccount,
    });

    await walletClient.writeContract({
      ...transferRequest,
    });

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

    // check for tx type
    expect(dividendResult.type).toBe("unsigned");
    // check for tx hash
    expect(dividendResult.txHash).toBeUndefined();
  });

  // it("check dividend automatic, with private key + off direct transfer success", async () => {
  //   // check initial balances of usdc of participants
  //   const initialBalances = await usdcBalanceCheck(participantsWalletAddr);
  //   const dividend = new Dividends(
  //     {
  //       id: 31337,
  //       rpcUrl: anvilRpcUrl,
  //     },
  //     anvilAdminPK
  //   );

  //   const divAmount = 1000;
  //   const dividendResult = await dividend.distributeDividend(
  //     {
  //       tokenAddress: mockTokenAAddress as `0x${string}`,
  //       stableCoinAddress: mockUSDCAddress as `0x${string}`,
  //       amount: divAmount, // assume we distribute dividend of 1000 usdc,
  //       indexer: async (tokenAddress, chain) => {
  //         const result = [];
  //         for (let i = 0; i < participantsWalletAddr.length; i++) {
  //           result.push({
  //             address: participantsWalletAddr[i],
  //             amount: ratioTokenA[i].toString(),
  //           });
  //         }

  //         return result;
  //       },
  //       businessLogic: async (params) => {
  //         const result: { address: string; amount: string }[] = [];

  //         const _totalTokenSupply = params.totalSupply;
  //         const _divAmount = params.dividendAmount;
  //         const totalTokenSupply = parseUnits(_totalTokenSupply, 0);
  //         const divAmount = parseUnits(_divAmount, 0);
  //         for (let i = 0; i < params.holders.length; i++) {
  //           const amountTokenOfMine = parseUnits(params.holders[i].amount, 0);
  //           const _ratio =
  //             (amountTokenOfMine * divAmount * parseUnits("10", 2)) /
  //             totalTokenSupply;

  //           // make sure ratio is not in decimal
  //           const ratio = _ratio.toString().split(".")[0];

  //           result.push({
  //             address: params.holders[i].address,
  //             amount: ratio,
  //           });
  //         }

  //         return result;
  //       },
  //     },
  //     dividendAddress,
  //     {
  //       title: "testtest",
  //       directTransfer: true,
  //     }
  //   );

  //   // check usdc balance of participants
  //   const finalBalances = await usdcBalanceCheck(
  //     dividendResult.dividendPortion.map((r) => r.address)
  //   );

  //   // check if final balances is greater than initial balances
  //   for (let i = 0; i < finalBalances.length; i++) {
  //     expect(parseUnits(finalBalances[i], 0)).toBeGreaterThan(
  //       parseUnits(initialBalances[i], 0)
  //     );
  //   }

  //   // check for tx type
  //   expect(dividendResult.type).toBe("signed");
  //   // check for tx hash
  //   expect(dividendResult.txHash).toBeDefined();

  //   // get tx receipt
  //   const txReceipt = await anvilClient.getTransactionReceipt({
  //     hash: dividendResult.txHash as `0x${string}`,
  //   });
  //   expect(txReceipt).toBeDefined();
  //   expect(txReceipt?.status).toBe("success");
  // });

  // it("check dividend automatic, with private key + off direct transfer failure", async () => {
  //   // check initial balances of usdc of participants
  //   const initialBalances = await usdcBalanceCheck(participantsWalletAddr);
  //   const dividend = new Dividends(
  //     {
  //       id: 31337,
  //       rpcUrl: anvilRpcUrl,
  //     },
  //     anvilAdminPK
  //   );

  //   const divAmount = 1000;
  //   const dividendResult = await dividend.distributeDividend(
  //     {
  //       tokenAddress: mockTokenAAddress as `0x${string}`,
  //       stableCoinAddress: mockUSDCAddress as `0x${string}`,
  //       amount: divAmount, // assume we distribute dividend of 1000 usdc,
  //       indexer: async (tokenAddress, chain) => {
  //         const result = [];
  //         for (let i = 0; i < participantsWalletAddr.length; i++) {
  //           result.push({
  //             address: participantsWalletAddr[i],
  //             amount: ratioTokenA[i].toString(),
  //           });
  //         }

  //         return result;
  //       },
  //       businessLogic: async (params) => {
  //         const result: { address: string; amount: string }[] = [];

  //         const _totalTokenSupply = params.totalSupply;
  //         const _divAmount = params.dividendAmount;
  //         const totalTokenSupply = parseUnits(_totalTokenSupply, 0);
  //         const divAmount = parseUnits(_divAmount, 0);
  //         for (let i = 0; i < params.holders.length; i++) {
  //           const amountTokenOfMine = parseUnits(params.holders[i].amount, 0);
  //           const _ratio =
  //             (amountTokenOfMine * divAmount * parseUnits("10", 2)) /
  //             totalTokenSupply;

  //           // make sure ratio is not in decimal
  //           const ratio = _ratio.toString().split(".")[0];

  //           result.push({
  //             address: params.holders[i].address,
  //             amount: ratio,
  //           });
  //         }

  //         return result;
  //       },
  //     },
  //     dividendAddress,
  //     {
  //       title: "testtest",
  //       directTransfer: true,
  //     }
  //   );

  //   // check usdc balance of participants
  //   const finalBalances = await usdcBalanceCheck(
  //     dividendResult.dividendPortion.map((r) => r.address)
  //   );

  //   // check if final balances is greater than initial balances
  //   for (let i = 0; i < finalBalances.length; i++) {
  //     expect(parseUnits(finalBalances[i], 0)).toBeGreaterThan(
  //       parseUnits(initialBalances[i], 0)
  //     );
  //   }

  //   // check for tx type
  //   expect(dividendResult.type).toBe("signed");
  //   // check for tx hash
  //   expect(dividendResult.txHash).toBeDefined();

  //   // get tx receipt
  //   const txReceipt = await anvilClient.getTransactionReceipt({
  //     hash: dividendResult.txHash as `0x${string}`,
  //   });
  //   expect(txReceipt).toBeDefined();
  //   expect(txReceipt?.status).toBe("success");
  // });
});
