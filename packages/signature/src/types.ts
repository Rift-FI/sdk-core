import { ethers, Signer } from "ethers";

/**
 * @interface Erc2612SignatureParameters
 * @description Defines the input parameters for creating an EIP-2612 permit signature.
 */
export interface Erc2612SignatureParameters {
  /** The signer (token owner) who will sign the permit message. */
  signer: Signer;
  /** The address of the ERC-20 token contract that implements EIP-2612. */
  tokenAddress: string;
  /** The address of the spender being granted the allowance. */
  spender: string;
  /** The amount of tokens to approve, as a human-readable string (e.g., "100.0"). */
  value: string;
  /** The duration in minutes for which the signature is valid. */
  deadlineInMinutes: number;
}

/**
 * @interface Erc2612SignatureOutput
 * @description Defines the structure of the generated EIP-2612 signature and its associated data.
 */
export interface Erc2612SignatureOutput {
  /** The 'v' component of the ECDSA signature. */
  v: number;
  /** The 'r' component of the ECDSA signature. */
  r: string;
  /** The 's' component of the ECDSA signature. */
  s: string;
  /** The Unix timestamp (in seconds) after which the signature is no longer valid. */
  deadline: number;
  /** The nonce used for this signature, fetched from the contract. */
  nonce: number;
  /** The approved value, in the token's smallest unit (e.g., wei). */
  value: ethers.BigNumberish;
}

/**
 * @interface GaslessTransferParameters
 * @description Defines the complete payload for submitting a gasless transfer request to the relayer API.
 */
export interface GaslessTransferParameters {
  /** The generated EIP-2612 signature object. */
  signature: Erc2612SignatureOutput;
  /** The address of the token being transferred. */
  tokenAddress: string;
  /** The recipient's address. */
  recipient: string;
  /** The amount to transfer, as a human-readable string (e.g., "100.0"). */
  amount: string;
}
