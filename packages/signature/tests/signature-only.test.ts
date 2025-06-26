import { Signature } from "../src/signature";
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
    expect(signatureInstance.getTransferApiUrl()).toBe(
      "https://rewardsvault-production.up.railway.app/api/gas/transfer"
    );
  });

  test("should allow setting custom transfer API URL", () => {
    const customUrl = "https://custom-api.example.com/transfer";
    signatureInstance.setTransferApiUrl(customUrl);
    expect(signatureInstance.getTransferApiUrl()).toBe(customUrl);
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
});
