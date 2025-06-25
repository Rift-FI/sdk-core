import { BigNumberish } from "ethers";

// Signature-related type definitions

export interface SignatureConfig {
  // Placeholder for signature configuration
}

export interface SignatureResult {
  // Placeholder for signature result
}

// EIP-2612 Permit types
export interface PermitSignature {
  v: number;
  r: string;
  s: string;
  deadline: bigint;
}

export interface TransferRequestBody {
  target: string;
  owner: string;
  value: string;
  deadline: string;
  v: number;
  r: string;
  s: string;
  to: string;
  charge: string;
  nativeFee: string;
}
