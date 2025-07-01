import fs from "fs";
import path from "path";

const CONTRACTS_DIR = path.join(__dirname, "..");
const ARTIFACTS_DIR = path.join(__dirname, "../src/artifacts");

// Read the compiled artifacts from Foundry's out directory
const erc20PermitArtifact = JSON.parse(
  fs.readFileSync(
    path.join(CONTRACTS_DIR, "out/ERC20Permit.sol/ERC20Permit.json"),
    "utf8"
  )
);

const gaslessRelayerArtifact = JSON.parse(
  fs.readFileSync(
    path.join(CONTRACTS_DIR, "out/GaslessRelayer.sol/GaslessRelayer.json"),
    "utf8"
  )
);

// Create artifacts directory if it doesn't exist
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

// Write the ERC20Permit artifact
fs.writeFileSync(
  path.join(ARTIFACTS_DIR, "erc20Permit.ts"),
  `export const ERC20Permit_ABI = ${JSON.stringify(
    erc20PermitArtifact.abi,
    null,
    2
  )} as const;

export const ERC20Permit_BYTECODE = '${erc20PermitArtifact.bytecode.object}';
`
);

// Write the GaslessRelayer artifact
fs.writeFileSync(
  path.join(ARTIFACTS_DIR, "gaslessRelayer.ts"),
  `export const GaslessRelayer_ABI = ${JSON.stringify(
    gaslessRelayerArtifact.abi,
    null,
    2
  )} as const;

export const GaslessRelayer_BYTECODE = '${
    gaslessRelayerArtifact.bytecode.object
  }';
`
);

console.log("✅ Artifacts generated successfully:");
console.log("  - ERC20Permit artifact written to src/artifacts/erc20Permit.ts");
console.log(
  "  - GaslessRelayer artifact written to src/artifacts/gaslessRelayer.ts"
);
