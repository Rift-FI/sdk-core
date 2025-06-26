import { Signature } from "../src/permit";
import {
  Erc2612SignatureParameters,
  Erc2612SignatureOutput,
  GaslessTransferParameters,
} from "../src/types";

describe("Signature Class", () => {
  let signatureInstance: Signature;

  beforeEach(() => {
    signatureInstance = new Signature();
  });

  test("should instantiate Signature class", () => {
    expect(signatureInstance).toBeDefined();
    expect(signatureInstance).toBeInstanceOf(Signature);
  });

  test("should have default transfer API URL", () => {
    expect(signatureInstance.transferApiUrl).toBe(
      "https://rewardsvault-production.up.railway.app/api/gas/transfer"
    );
  });

  test("should allow setting custom transfer API URL", () => {
    const customUrl = "https://custom-api.example.com/transfer";
    signatureInstance.transferApiUrl = customUrl;
    expect(signatureInstance.transferApiUrl).toBe(customUrl);
  });

  test("should warn when setting non-HTTPS URL", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
    const httpUrl = "http://insecure-api.example.com/transfer";

    signatureInstance.transferApiUrl = httpUrl;

    expect(consoleSpy).toHaveBeenCalledWith(
      "Warning: Using a non-HTTPS URL for the transfer API."
    );
    expect(signatureInstance.transferApiUrl).toBe(httpUrl);

    consoleSpy.mockRestore();
  });

  test("should have erc2612signature method", () => {
    expect(typeof signatureInstance.erc2612signature).toBe("function");
  });

  test("should have gasless method", () => {
    expect(typeof signatureInstance.gasless).toBe("function");
  });

  // Test type interfaces exist
  test("should export required type interfaces", () => {
    // These tests just verify the types can be imported and used
    const mockSignatureParams: Erc2612SignatureParameters = {
      signer: {} as any, // Mock signer
      tokenAddress: "0x123...",
      spender: "0x456...",
      value: "100.0",
      deadlineInMinutes: 60,
    };

    const mockSignatureOutput: Erc2612SignatureOutput = {
      v: 27,
      r: "0x123...",
      s: "0x456...",
      deadline: 1234567890,
      nonce: 0,
      value: BigInt(100),
    };

    const mockGaslessParams: GaslessTransferParameters = {
      signature: mockSignatureOutput,
      tokenAddress: "0x123...",
      recipient: "0x789...",
      amount: "100.0",
    };

    // If we can create these objects, the types are properly exported
    expect(mockSignatureParams).toBeDefined();
    expect(mockSignatureOutput).toBeDefined();
    expect(mockGaslessParams).toBeDefined();
  });

  test("should throw error when signer has no provider", async () => {
    const mockSigner = {
      provider: null,
      getAddress: jest.fn(),
      signTypedData: jest.fn(),
    } as any;

    const params: Erc2612SignatureParameters = {
      signer: mockSigner,
      tokenAddress: "0x123...",
      spender: "0x456...",
      value: "100.0",
      deadlineInMinutes: 60,
    };

    await expect(signatureInstance.erc2612signature(params)).rejects.toThrow(
      "Signer must be connected to a provider."
    );
  });

  // TODO: Add integration tests with mock signer and provider when needed
  // test('should generate ERC2612 signature with mock signer', async () => {
  //   // Mock implementation would go here
  // });

  // TODO: Add test for gasless transfer with mock API response
  // test('should submit gasless transfer successfully', async () => {
  //   // Mock fetch and test gasless method
  // });
});
