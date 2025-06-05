import { privateKeyToAccount } from "viem/accounts";
import { Dividends } from "../dividend";
import { Chain } from "../types";
import { describe, expect, it, beforeEach } from "@jest/globals";
import { createPublicClient, http } from "viem";

describe("Dividends", () => {
  let dividends: Dividends;

  beforeEach(async () => {
    // make sure connected to anvil rpc localhost with port 13519
    const anvilRpcUrl = "http://localhost:13519";
    const anvilAdminPK =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const anvilAnotherPK =
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

    const anvilAdminAccount = privateKeyToAccount(anvilAdminPK);
    const anvilUSDCOwnerAccount = privateKeyToAccount(anvilAnotherPK);

    const anvilAdminClient = createPublicClient({
      transport: http(anvilRpcUrl),
    });
    const anvilAnotherClient = createPublicClient({
      transport: http(anvilRpcUrl),
    });

    // check if connected to anvil
    const balance = await anvilAdminClient.getBalance({
      address: anvilAdminAccount.address,
    });
    expect(balance).toBeGreaterThan(0);

    // deploy smart contracts of mockUSDC, mockTokenA, mockTokenB, Di
  });

  it("should assert true with true", () => {
    expect(true).toBe(true);
  });
});
