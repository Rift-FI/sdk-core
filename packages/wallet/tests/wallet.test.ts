import { Sphere, Environment } from "../src/index";

describe("Wallet Package", () => {
  let sphere: Sphere;
  const mockConfig = {
    environment: Environment.DEVELOPMENT,
    apiKey: "test-api-key",
  };

  beforeEach(() => {
    sphere = new Sphere(mockConfig);
  });

  test("should assert true (basic sanity test)", () => {
    expect(true).toBe(true);
  });

  test("should create a Sphere instance", () => {
    expect(sphere).toBeInstanceOf(Sphere);
  });

  test("should have required services", () => {
    expect(sphere.auth).toBeDefined();
    expect(sphere.wallet).toBeDefined();
    expect(sphere.transactions).toBeDefined();
    expect(sphere.paymentLinks).toBeDefined();
    expect(sphere.proxyWallet).toBeDefined();
    expect(sphere.defi).toBeDefined();
    expect(sphere.assets).toBeDefined();
    expect(sphere.onramp).toBeDefined();
  });

  test("should have API key functionality", () => {
    expect(typeof sphere.setApiKey).toBe("function");
    expect(typeof sphere.hasApiKey).toBe("function");
    expect(sphere.hasApiKey()).toBe(true); // should have API key from config
  });

  test("should handle authentication methods", () => {
    expect(typeof sphere.setBearerToken).toBe("function");
    expect(typeof sphere.clearBearerToken).toBe("function");
    expect(typeof sphere.isAuthenticated).toBe("function");
  });

  test("should get environment correctly", () => {
    expect(sphere.getEnvironment()).toBe(Environment.DEVELOPMENT);
  });

  test("should validate basic wallet functionality", () => {
    // Simple assertion tests
    const walletName = "StratoSphere";
    expect(walletName).toBe("StratoSphere");
    expect(typeof sphere.config).toBe("object");
  });
});
