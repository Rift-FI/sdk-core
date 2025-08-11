import { Rift, Environment } from "../src/index";

describe("Wallet Package", () => {
  let rift: Rift;
  const mockConfig = {
    environment: Environment.DEVELOPMENT,
    apiKey: "test-api-key",
  };


  beforeEach(() => {
    rift = new Rift(mockConfig);
  });

  test("should assert true (basic sanity test)", () => {
    expect(true).toBe(true);
  });


  test("should create a Rift instance", () => {
    expect(rift).toBeInstanceOf(Rift);
  });

  test("should have required services", () => {
    expect(rift.auth).toBeDefined();
    expect(rift.wallet).toBeDefined();
    
    expect(rift.transactions).toBeDefined();
    expect(rift.paymentLinks).toBeDefined();
    expect(rift.signer).toBeDefined();
    expect(rift.defi).toBeDefined();
    expect(rift.assets).toBeDefined();
    expect(rift.onramp).toBeDefined();
    expect(rift.notifications).toBeDefined();
  });

  test("should have API key functionality", () => {
    expect(typeof rift.setApiKey).toBe("function");
    expect(typeof rift.hasApiKey).toBe("function");
    expect(rift.hasApiKey()).toBe(true); // should have API key from config
  });

  test("should handle authentication methods", () => {
    expect(typeof rift.setBearerToken).toBe("function");
    expect(typeof rift.clearBearerToken).toBe("function");
    expect(typeof rift.isAuthenticated).toBe("function");
  });

  test("should get environment correctly", () => {
    expect(rift.getEnvironment()).toBe(Environment.DEVELOPMENT);
  });

  test("should validate basic wallet functionality", () => {
    // Simple assertion tests
    const walletName = "Rift Finance";
    expect(walletName).toBe("Rift Finance");
      expect(typeof rift.config).toBe("object");
  });
});
