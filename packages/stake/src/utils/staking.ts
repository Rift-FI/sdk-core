export const StakingAbi = [
  {
    inputs: [
      { internalType: "address", name: "_stablecoin", type: "address" },
      { internalType: "address", name: "_pstToken", type: "address" },
      { internalType: "address", name: "_pstjToken", type: "address" },
      { internalType: "address", name: "_investmentManager", type: "address" },
      { internalType: "address", name: "_liquidityManager", type: "address" },
      { internalType: "address", name: "_treasury", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "AccessControlBadConfirmation",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "enum PSTStaking.Tranche", name: "tranche", type: "uint8" }
    ],
    name: "Staked",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "Withdrawn",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "PSTMinted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "PSTBurned",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "PSTJMinted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "PSTJBurned",
    type: "event"
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "enum PSTStaking.Tranche", name: "tranche", type: "uint8" }
    ],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "stakes",
    outputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "enum PSTStaking.Tranche", name: "tranche", type: "uint8" },
      { internalType: "uint256", name: "stakeTimestamp", type: "uint256" },
      { internalType: "uint256", name: "accruedRewards", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "getPSTBalance",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "getPSTJBalance",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalCollateral",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "scalingFactor",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "enum PSTStaking.Tranche", name: "tranche", type: "uint8" },
      { internalType: "uint256", name: "period", type: "uint256" }
    ],
    name: "setLockupPeriod",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "newAPY", type: "uint256" }
    ],
    name: "setJuniorAPY",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "rebase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "hasRole",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  }
]; 