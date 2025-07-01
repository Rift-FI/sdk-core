import { describe, expect, it } from "@jest/globals";

describe("Dex Package", () => {
  describe("Module Structure", () => {
    it("should export main Dex class", async () => {
      const dexModule = await import("../src");
      expect(dexModule.Dex).toBeDefined();
      expect(typeof dexModule.Dex).toBe("function");
    });

    it("should export SupportedChain enum", async () => {
      const { SupportedChain } = await import("../src/types/chains");
      expect(SupportedChain).toBeDefined();
      expect(SupportedChain.ETHEREUM_MAINNET).toBe("ethereum-mainnet");
      expect(SupportedChain.BSC_MAINNET).toBe("bsc-mainnet");
      expect(SupportedChain.POLYGON_MAINNET).toBe("polygon-mainnet");
    });

    it("should export EstimatedSwap interface type", async () => {
      const typesModule = await import("../src/types");
      expect(typesModule).toBeDefined();
    });

    it("should have SwapService class available", async () => {
      const { SwapService } = await import("../src/services/swap");
      expect(SwapService).toBeDefined();
      expect(typeof SwapService).toBe("function");
    });

    it("should have constants defined", async () => {
      const constantsModule = await import("../src/constants");
      expect(constantsModule.SMART_ROUTER_ADDRESS).toBeDefined();
    });
  });

  describe("Package Configuration", () => {
    it("should have valid package.json", () => {
      const packageJson = require("../package.json");
      expect(packageJson.name).toBe("@stratosphere-network/dex");
      expect(packageJson.main).toBeDefined();
      expect(packageJson.types).toBeDefined();
    });

    it("should have build script configured", () => {
      const packageJson = require("../package.json");
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.dev).toBeDefined();
    });

    it("should have required dependencies", () => {
      const packageJson = require("../package.json");
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies["@stratospherex/sdk"]).toBeDefined();
      expect(
        packageJson.dependencies["@stratospherex/smart-router"]
      ).toBeDefined();
      expect(packageJson.dependencies["viem"]).toBeDefined();
    });
  });
});
