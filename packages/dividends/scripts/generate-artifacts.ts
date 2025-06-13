import fs from "fs";
import path from "path";

const CONTRACTS_DIR = path.join(__dirname, "..");
const ARTIFACTS_DIR = path.join(__dirname, "../src/artifacts");

// Read the compiled artifacts
const mockUSDCArtifact = JSON.parse(
  fs.readFileSync(
    path.join(CONTRACTS_DIR, "out/MockUSDC.sol/MockUSDC.json"),
    "utf8"
  )
);
const mockTokenAArtifact = JSON.parse(
  fs.readFileSync(
    path.join(CONTRACTS_DIR, "out/MockTokenA.sol/MockTokenA.json"),
    "utf8"
  )
);
const mockTokenBArtifact = JSON.parse(
  fs.readFileSync(
    path.join(CONTRACTS_DIR, "out/MockTokenB.sol/MockTokenB.json"),
    "utf8"
  )
);
const dividendContractArtifact = JSON.parse(
  fs.readFileSync(
    path.join(CONTRACTS_DIR, "out/Dividend.sol/Dividend.json"),
    "utf8"
  )
);

const dividendFactoryContractArtifact = JSON.parse(
  fs.readFileSync(
    path.join(CONTRACTS_DIR, "out/DividendFactory.sol/DividendFactory.json"),
    "utf8"
  )
);

// Create artifacts directory if it doesn't exist
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

// Write the artifacts
fs.writeFileSync(
  path.join(ARTIFACTS_DIR, "mockUSDC.ts"),
  `export const MockUSDC_ABI = ${JSON.stringify(
    mockUSDCArtifact.abi,
    null,
    2
  )} as const;
export const MockUSDC_BYTECODE = '${mockUSDCArtifact.bytecode.object}';`
);

fs.writeFileSync(
  path.join(ARTIFACTS_DIR, "mockTokenA.ts"),
  `export const MockTokenA_ABI = ${JSON.stringify(
    mockTokenAArtifact.abi,
    null,
    2
  )} as const;
export const MockTokenA_BYTECODE = '${mockTokenAArtifact.bytecode.object}';`
);

fs.writeFileSync(
  path.join(ARTIFACTS_DIR, "mockTokenB.ts"),
  `export const MockTokenB_ABI = ${JSON.stringify(
    mockTokenBArtifact.abi,
    null,
    2
  )} as const;
export const MockTokenB_BYTECODE = '${mockTokenBArtifact.bytecode.object}';`
);

fs.writeFileSync(
  path.join(ARTIFACTS_DIR, "dividendContract.ts"),
  `export const DividendContract_ABI = ${JSON.stringify(
    dividendContractArtifact.abi,
    null,
    2
  )} as const;
export const DividendContract_BYTECODE = '${
    dividendContractArtifact.bytecode.object
  }';`
);

fs.writeFileSync(
  path.join(ARTIFACTS_DIR, "dividendFactoryContract.ts"),
  `export const DividendFactoryContract_ABI = ${JSON.stringify(
    dividendFactoryContractArtifact.abi,
    null,
    2
  )} as const;
export const DividendFactoryContract_BYTECODE = '${
    dividendFactoryContractArtifact.bytecode.object
  }';`
);
