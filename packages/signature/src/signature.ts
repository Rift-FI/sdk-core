import { ethers, Signer } from "ethers";
import {
  Erc2612SignatureOutput,
  Erc2612SignatureParameters,
  GaslessTransferParameters,
} from "./types";
// Minimal ABI for ERC-20 Permit functions
const ERC20_PERMIT_ABI = [
  "function nonces(address owner) view returns (uint256)",
  "function name() view returns (string)",
  "function NAME() view returns (bytes32)",
  "function decimals() view returns (uint8)",
] as const;

/**
 * @class Signature
 * @description A class to handle the creation of EIP-2612 permit signatures
 * and submission to a gasless transfer API.
 */
export class Signature {
  private _transferApiUrl: string;

  /**
   * @constructor
   * @param {string} [transferApiUrl] - The URL of the gasless transfer API.
   * Defaults to 'https://rewardsvault-production.up.railway.app/api/gas/transfer'.
   */
  constructor(
    transferApiUrl: string = "https://rewardsvault-production.up.railway.app/api/gas/transfer"
  ) {
    this._transferApiUrl = transferApiUrl;
  }

  /**
   * @getter transferApiUrl
   * @returns {string} The current gasless transfer API URL.
   */
  public getTransferApiUrl(): string {
    return this._transferApiUrl;
  }

  /**
   * @setter transferApiUrl
   * @param {string} url - The new URL for the gasless transfer API.
   */
  public setTransferApiUrl(url: string) {
    // Basic validation could be added here
    if (!url.startsWith("https://")) {
      console.warn("Warning: Using a non-HTTPS URL for the transfer API.");
    }
    this._transferApiUrl = url;
  }

  /**
   * Generates an EIP-2612 permit signature.
   * This method performs all necessary on-chain reads and off-chain signing.
   * @param {Erc2612SignatureParameters} params - The parameters for generating the signature.
   * @returns {Promise<Erc2612SignatureOutput>} The generated signature object.
   */
  public async erc2612signature(
    params: Erc2612SignatureParameters
  ): Promise<Erc2612SignatureOutput> {
    const { signer, tokenAddress, spender, value, deadlineInMinutes } = params;

    if (!signer.provider) {
      throw new Error("Signer must be connected to a provider.");
    }

    const ownerAddress = await signer.getAddress();
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_PERMIT_ABI,
      signer.provider
    );

    // 1. Fetch necessary on-chain data in parallel
    const [nonce, tokenName, chainId, decimals] = await Promise.all([
      tokenContract.nonces(ownerAddress),
      tokenContract.name(),
      signer.provider.getNetwork().then((network) => network.chainId),
      tokenContract.decimals(),
    ]);

    // 2. Calculate deadline
    const deadline = Math.floor(Date.now() / 1000) + deadlineInMinutes * 60;

    // 3. Parse the value into the token's smallest unit
    const parsedValue = ethers.parseUnits(value, decimals);

    // 4. Define the EIP-712 domain
    // The domain separates signatures from different applications and chains [1]
    const domain = {
      name: tokenName,
      version: "1", // Common version for EIP-2612 tokens [2]
      chainId: chainId,
      verifyingContract: tokenAddress,
    };

    // try to get version from the contract
    try {
      const version = await tokenContract.version();
      domain.version = version;
    } catch (error) {
      console.error("Error getting version from the contract:", error);
    }

    // 5. Define the EIP-712 types for the Permit message [3]
    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    // 6. Construct the message to be signed
    const message = {
      owner: ownerAddress,
      spender: spender,
      value: parsedValue,
      nonce: Number(nonce), // Handle both number and bigint
      deadline: deadline,
    };

    // 7. Sign the typed data
    // This prompts the user's wallet (e.g., MetaMask) to sign the structured data [3]
    const signature = await signer.signTypedData(domain, types, message);

    // 8. Split the signature into v, r, s components [3, 4]
    const { v, r, s } = ethers.Signature.from(signature);

    return { v, r, s, deadline, nonce: Number(nonce), value: parsedValue };
  }

  /**
   * Submits the permit signature and transfer details to the gasless relayer API.
   * @param {GaslessTransferParameters} params - The payload for the gasless transfer.
   * @returns {Promise<any>} The response from the relayer API.
   */
  public async gasless(params: GaslessTransferParameters): Promise<any> {
    const { signature, tokenAddress, recipient, amount } = params;

    const payload = {
      signature: {
        v: signature.v,
        r: signature.r,
        s: signature.s,
        deadline: signature.deadline,
      },
      transfer: {
        token: tokenAddress,
        recipient: recipient,
        amount: amount,
      },
    };

    try {
      const response = await fetch(this._transferApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(
          `API request failed with status ${response.status}: ${JSON.stringify(
            errorBody
          )}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error submitting gasless transfer:", error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
}
