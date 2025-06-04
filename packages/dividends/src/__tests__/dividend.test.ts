import { Dividends } from "../dividend";
import { Chain } from "../types";
import { DividendsError } from "../error";
import { describe, expect, it, beforeEach, jest } from "@jest/globals";

describe("Dividends", () => {
  let dividends: Dividends;
  const mockChain: Chain = {
    id: 1,
    rpcUrl: "https://mainnet.infura.io/v3/your-api-key",
  };

  beforeEach(() => {
    dividends = new Dividends(mockChain);
  });

  describe("constructor", () => {
    it("should create instance without private key", () => {
      expect(dividends).toBeInstanceOf(Dividends);
    });

    it("should create instance with valid private key", () => {
      const privateKey =
        "0x1234567890123456789012345678901234567890123456789012345678901234";
      const dividendsWithKey = new Dividends(mockChain, privateKey);
      expect(dividendsWithKey).toBeInstanceOf(Dividends);
    });

    it("should throw error with invalid private key", () => {
      const invalidPrivateKey = "invalid-key";
      expect(() => new Dividends(mockChain, invalidPrivateKey)).toThrow(
        DividendsError
      );
    });
  });

  describe("distributeDividendManual", () => {
    const mockParams = {
      tokenAddress: "0x1234567890123456789012345678901234567890",
      stableCoinAddress: "0x0987654321098765432109876543210987654321",
      amount: 1000,
      indexer: async (a: any) => [],
      businessLogic: async (a: any) => [],
      privateKey:
        "0x1234567890123456789012345678901234567890123456789012345678901234",
    };

    it("should throw error when wallet client is not initialized", async () => {
      await expect(
        dividends.distributeDividendManual(mockParams)
      ).rejects.toThrow();
    });
  });

  describe("distributeDividend", () => {
    const mockParams = {
      tokenAddress: "0x1234567890123456789012345678901234567890",
      stableCoinAddress: "0x0987654321098765432109876543210987654321",
      amount: 1000,
      indexer: async (a: any) => [],
      businessLogic: async (a: any) => [],
      privateKey:
        "0x1234567890123456789012345678901234567890123456789012345678901234",
    };

    const mockDividendContractAddress =
      "0xabcdef1234567890abcdef1234567890abcdef12";

    it("should throw error when wallet client is not initialized", async () => {
      await expect(
        dividends.distributeDividend(mockParams, mockDividendContractAddress)
      ).rejects.toThrow();
    });
  });
});
