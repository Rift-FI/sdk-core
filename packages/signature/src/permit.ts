import {
  Wallet,
  Contract,
  TypedDataDomain,
  TypedDataField,
  JsonRpcProvider,
  parseUnits,
  formatUnits,
  toBigInt,
  toBeHex,
  Signature,
} from "ethers";
import axios from "axios";
import { PermitSignature, TransferRequestBody } from "./types";

const TRANSFER_API_URL =
  "https://rewardsvault-production.up.railway.app/api/gas/transfer";

const getPermitDomain = async (
  tokenContract: Contract,
  chainId: bigint
): Promise<TypedDataDomain> => {
  let name: string = "Unknown Token";
  try {
    name = await tokenContract.name();
  } catch (e) {
    try {
      const nameBytes = await tokenContract.NAME();
      name = typeof nameBytes === "string" ? nameBytes : "Unknown Token";
    } catch (innerE) {
      console.error(
        `Error ${JSON.stringify(innerE)} while fetching token name }`
      );
    }
  }

  let version: string = "1";
  try {
    version = await tokenContract.version();
  } catch (e) {
    console.warn(
      `Could not retrieve token version for ${tokenContract.target}: ${e}`
    );
  }

  return {
    name: name,
    version: version,
    chainId: chainId,
    verifyingContract: tokenContract.target as string,
  };
};

const permitTypes: Record<string, TypedDataField[]> = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

/**
 * Generates an ERC2612 permit signature.
 * @param ownerWallet The wallet of the token owner signing the permit.
 * @param tokenAddress The address of the ERC20 token contract.
 * @param spenderAddress The address authorised to spend the tokens (your relayer/contract).
 * @param value The amount of tokens to approve.
 * @param deadline The permit expiration timestamp (Unix seconds).
 * @param provider Ethers provider instance.
 * @returns The signature components (v, r, s) and deadline.
 */
export const generatePermitSignature = async (
  ownerWallet: Wallet,
  tokenAddress: string,
  spenderAddress: string,
  value: bigint,
  deadline: bigint,
  provider: JsonRpcProvider
): Promise<PermitSignature> => {
  const tokenContract = new Contract(
    tokenAddress,
    [
      "function nonces(address owner) view returns (uint256)",
      "function name() view returns (string)",
      "function NAME() view returns (bytes32)",
      "function version() view returns (string)",
    ],
    provider
  );

  const nonce = await tokenContract.nonces(ownerWallet.address);
  const network = await provider.getNetwork();
  const chainId = network.chainId;
  const domain = await getPermitDomain(tokenContract, chainId);

  const permitValues = {
    owner: ownerWallet.address,
    spender: spenderAddress,
    value: value,
    nonce: nonce,
    deadline: deadline,
  };

  const signature = await ownerWallet.signTypedData(
    domain,
    permitTypes,
    permitValues
  );

  const sig = Signature.from(signature);

  return {
    v: sig.v,
    r: sig.r,
    s: sig.s,
    deadline: deadline,
  };
};

/**
 * Prepares the JSON body for the /transfer API endpoint.
 *
 * @param targetNetwork Target network identifier (e.g., "sepolia", "mainnet").
 * @param ownerAddress Address of the token owner.
 * @param tokenValue Amount of the token being transferred (as bigint).
 * @param permitSignature The permit signature object { v, r, s, deadline }.
 * @param recipientAddress The final recipient of the tokens.
 * @param chargeValue Fee charged for the gasless transaction (as bigint).
 * @param nativeFeeValue Native fee component (as bigint).
 * @returns The request body object.
 */
export const prepareTransferBody = (
  targetNetwork: string,
  ownerAddress: string,
  tokenValue: bigint,
  permitSignature: PermitSignature,
  recipientAddress: string,
  chargeValue: bigint,
  nativeFeeValue: bigint
): TransferRequestBody => {
  return {
    target: targetNetwork,
    owner: ownerAddress,
    value: tokenValue.toString(),
    deadline: permitSignature.deadline.toString(),
    v: permitSignature.v,
    r: permitSignature.r,
    s: permitSignature.s,
    to: recipientAddress,
    charge: chargeValue.toString(),
    nativeFee: nativeFeeValue.toString(),
  };
};

/**
 * Calls the gas abstraction API to execute the transfer.
 *
 * @param requestBody The prepared request body from prepareTransferBody.
 * @returns The API response.
 */
export const submitGaslessTransfer = async (
  requestBody: TransferRequestBody
): Promise<any> => {
  try {
    const response = await axios.post(TRANSFER_API_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Transfer API Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error calling transfer API:",
      error.response?.data || error.message
    );
    throw new Error(
      `API call failed: ${error.response?.data?.error || error.message}`
    );
  }
};
