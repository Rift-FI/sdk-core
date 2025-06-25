import {
  generatePermitSignature,
  prepareTransferBody,
  submitGaslessTransfer,
} from "../src/permit";

describe("Signature Utils", () => {
  test("should be defined", () => {
    expect(true).toBe(true);
  });

  test("should export permit functions", () => {
    expect(generatePermitSignature).toBeDefined();
    expect(prepareTransferBody).toBeDefined();
    expect(submitGaslessTransfer).toBeDefined();
  });

  test("prepareTransferBody should format request correctly", () => {
    const mockSignature = {
      v: 27,
      r: "0x123...",
      s: "0x456...",
      deadline: BigInt(1234567890),
    };

    const result = prepareTransferBody(
      "sepolia",
      "0xowner",
      BigInt(1000),
      mockSignature,
      "0xrecipient",
      BigInt(10),
      BigInt(1)
    );

    expect(result).toEqual({
      target: "sepolia",
      owner: "0xowner",
      value: "1000",
      deadline: "1234567890",
      v: 27,
      r: "0x123...",
      s: "0x456...",
      to: "0xrecipient",
      charge: "10",
      nativeFee: "1",
    });
  });

  // TODO: Add integration tests with mock provider when implementation is ready
});
