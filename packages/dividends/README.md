# @strato-sdk/dividends

This package provides dividend management functionality for the Strato SDK.

## Installation

```bash
npm install @strato-sdk/dividends
```

## Usage

```typescript
import { Dividend } from "@strato-sdk/dividends";

const dividend = new Dividend({
  tokenAddress: "0x...",
  amount: "1000000000000000000",
  startTime: Math.floor(Date.now() / 1000),
  endTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
});

const info = dividend.getInfo();
console.log(info);
```

## Features

- Dividend configuration and management
- Dividend status tracking
- Claim amount tracking

## API Reference

### Dividend

The main class for managing dividends.

#### Constructor

```typescript
constructor(config: DividendConfig)
```

#### Methods

- `getInfo(): DividendInfo` - Get current dividend information

### Types

- `DividendConfig` - Configuration for creating a new dividend
- `DividendInfo` - Information about a dividend's current state
