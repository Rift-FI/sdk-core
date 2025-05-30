# StratoSphere SDK

This is a monorepo structure for the StratoSphere SDK, allowing different modules to be published as separate npm packages.

## 📦 Packages

- **[@stratosphere-network/core](./packages/core)** - Core SDK orchestrator
- **[@stratosphere-network/wallet](./packages/wallet)** - Wallet functionality
- **[@stratosphere-network/shared](./packages/shared)** - Shared utilities
- **[@stratosphere-network/token](./packages/token)** - Token module (coming soon)
- **[@stratosphere-network/staking](./packages/staking)** - Staking module (coming soon)
- **[@stratosphere-network/dividends](./packages/dividends)** - Dividends module (coming soon)
- **[@stratosphere-network/dex](./packages/dex)** - DEX module (coming soon)

## 🚀 Getting Started

### 2. Install dependencies

```bash
npm install
```

### 3. Build all packages

```bash
npm run build
```

### 4. Run development mode

```bash
npm run dev
```

## 📝 Development

### Adding a new module

1. Create a new directory in `packages/`:

```bash
mkdir -p packages/new-module/src
```

2. Create `package.json`:

```json
{
  "name": "@stratosphere-network/new-module",
  "version": "1.0.0",
  "description": "Description of your module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "prepublishOnly": "npm run clean && npm run build"
  },
  "dependencies": {
    "@stratosphere-network/shared": "^1.0.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

3. Create `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"],
  "references": [{ "path": "../shared" }]
}
```

4. Add to root `tsconfig.json` references:

```json
{
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/new-module" }
  ]
}
```

5. Update the core package to include your module, only do this after your package is published to npm. Like shown below.
```typescript
import Sphere, { SphereConfig } from "@stratosphere-network/wallet";

export class StratoSphere {
  public Wallet: Sphere | null = null;

  setupWallet(config: SphereConfig) {
    this.Wallet = new Sphere(config);
  }

  getWallet() {
    return this.Wallet;
  }
  hasWallet() {
    return this.Wallet !== null;
  }
}

export default StratoSphere;
```

## 🚢 Publishing

### Publish all packages:

```bash
npm run publish:all
```

### Publish individual package:

```bash
cd packages/wallet
npm publish --access public
```

### Version management:

```bash
# Bump patch version for all packages
npm run version:patch

# Bump minor version for all packages
npm run version:minor

# Bump major version for all packages
npm run version:major
```

## 🔧 Scripts

- `npm run build` - Build all packages
- `npm run clean` - Clean all build outputs
- `npm run dev` - Run all packages in watch mode
- `npm run test` - Run tests for all packages
- `npm run publish:all` - Publish all packages to npm

## 📂 Structure

```
sdk/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── wallet/
│   │   ├── src/
│   │   │   ├── services/
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   └── ...
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── package.json
├── tsconfig.json
└── README.md
```

## 🤝 Contributing

1. Create a feature branch with naming `module-name/feature` e.g `wallet/getBalances`  
2. Make your changes
3. When done, merge the changes with `module-name/preview` e.g `wallet/preview`
4. Deploy to npm manually through  github actions
5. If everything works, create a pull request against `preview`
6. The  pull request  will be merged to master after review.


## 📄 License

MIT
