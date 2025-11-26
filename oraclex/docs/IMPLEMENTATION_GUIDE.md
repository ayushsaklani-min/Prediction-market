# OracleX V2 Implementation Guide

## 🎯 Overview

This guide walks you through implementing the complete OracleX V2 upgrade from the current MVP to a production-ready, mainnet-launch protocol.

---

## 📋 Phase 1: Smart Contract Development (Week 1-2)

### Step 1.1: Setup Development Environment

```bash
# Install dependencies
npm install --save-dev @openzeppelin/contracts-upgradeable@^5.0.0
npm install --save-dev @openzeppelin/hardhat-upgrades@^3.0.0
npm install --save-dev @chainlink/contracts@^0.8.0

# Update hardhat config
cp hardhat-v2.config.js hardhat.config.js

# Update package.json
cp package-v2.json package.json
npm install
```

### Step 1.2: Deploy Core Contracts

```bash
# Compile all V2 contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to testnet
npx hardhat run scripts-v2/deploy-v2.js --network amoy
```

### Step 1.3: Verify Contracts

```bash
# Verify each contract
npx hardhat verify --network amoy <CONTRACT_ADDRESS>

# Or use batch verification
npm run verify
```

---

## 📋 Phase 2: Chainlink Functions Integration (Week 2-3)

### Step 2.1: Setup Chainlink Subscription

1. Go to https://functions.chain.link
2. Create new subscription
3. Fund with LINK tokens
4. Add consumer contracts (OracleAdapterV2)

### Step 2.2: Deploy Functions

```javascript
// Upload AI oracle function
const source = fs.readFileSync('./chainlink-functions/ai-oracle.js', 'utf8');
const subscriptionId = YOUR_SUBSCRIPTION_ID;

const tx = await functionsRouter.sendRequest(
  subscriptionId,
  source,
  secrets,
  args,
  gasLimit
);
```

### Step 2.3: Configure Secrets

```javascript
// Encrypt secrets for DON
const secrets = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  NEWS_API_KEY: process.env.NEWS_API_KEY
};

// Upload to DON
await uploadSecrets(secrets);
```

### Step 2.4: Test AI Oracle

```bash
# Create test market
node scripts-v2/test-ai-oracle.js

# Verify AI prediction
# Check commitment hash
# Validate probability range
```

---

## 📋 Phase 3: Frontend Development (Week 3-4)

### Step 3.1: Setup Next.js 15

```bash
cd frontend-v2
npx create-next-app@latest . --typescript --tailwind --app

# Install Web3 dependencies
npm install wagmi@^2.12.7 viem@^2.21.0
npm install @rainbow-me/rainbowkit@^2.1.5
npm install @tanstack/react-query@^5.59.16
```

### Step 3.2: Configure Wagmi

```typescript
// app/providers.tsx
import { WagmiProvider, createConfig } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

const config = createConfig({
  chains: [polygon, polygonAmoy],
  transports: {
    [polygon.id]: http(),
    [polygonAmoy.id]: http()
  }
});
```

### Step 3.3: Build Core Pages

```
frontend-v2/
├── app/
│   ├── page.tsx              # Home / Market Browser
│   ├── market/[id]/page.tsx  # Market Detail
│   ├── portfolio/page.tsx    # User Portfolio
│   ├── governance/page.tsx   # DAO Governance
│   └── analytics/page.tsx    # Protocol Analytics
├── components/
│   ├── MarketCard.tsx
│   ├── TradingInterface.tsx
│   ├── PositionManager.tsx
│   └── GovernanceProposal.tsx
└── hooks/
    ├── useMarkets.ts
    ├── useAMM.ts
    └── useGovernance.ts
```

### Step 3.4: Implement Trading Interface

```typescript
// components/TradingInterface.tsx
export function TradingInterface({ marketId }: { marketId: string }) {
  const { buy, sell } = useAMM();
  const [side, setSide] = useState<0 | 1>(1); // YES
  const [amount, setAmount] = useState('');

  const handleBuy = async () => {
    await buy({
      marketId,
      side,
      amountIn: parseUnits(amount, 6),
      minSharesOut: calculateMinShares(amount, slippage)
    });
  };

  return (
    <div className="trading-interface">
      {/* UI implementation */}
    </div>
  );
}
```

---

## 📋 Phase 4: Backend Migration (Week 4)

### Step 4.1: Migrate to Supabase Edge Functions

```typescript
// supabase/functions/market-indexer/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Index blockchain events
  const events = await fetchMarketEvents();
  
  for (const event of events) {
    await supabase.from('markets').upsert({
      market_id: event.marketId,
      // ... other fields
    });
  }

  return new Response(JSON.stringify({ success: true }));
});
```

### Step 4.2: Setup The Graph Subgraph

```yaml
# subgraph.yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: MarketFactoryV2
    network: polygon
    source:
      address: "0x..."
      abi: MarketFactoryV2
      startBlock: 12345678
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Market
        - Trade
        - Position
      abis:
        - name: MarketFactoryV2
          file: ./abis/MarketFactoryV2.json
      eventHandlers:
        - event: MarketCreated(indexed bytes32,string,string,uint8,indexed address,uint256)
          handler: handleMarketCreated
      file: ./src/mapping.ts
```

### Step 4.3: Deploy Subgraph

```bash
# Build subgraph
npm run codegen
npm run build

# Deploy to The Graph
graph deploy --product hosted-service oraclex/oraclex-v2
```

---

## 📋 Phase 5: Testing & Security (Week 5-6)

### Step 5.1: Comprehensive Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Fork tests
FORK=true npm test

# Coverage
npm run test:coverage
```

### Step 5.2: Security Analysis

```bash
# Slither
slither . --filter-paths "node_modules|test"

# Mythril
myth analyze contracts-v2/*.sol

# Manual audit
# Review SECURITY_AUDIT_CHECKLIST.md
```

### Step 5.3: Bug Bounty

1. Launch on Immunefi
2. Set bounty amounts
3. Define scope
4. Monitor submissions

---

## 📋 Phase 6: Deployment (Week 7)

### Step 6.1: Testnet Deployment

```bash
# Deploy to Polygon Amoy
npm run deploy:testnet

# Verify contracts
npm run verify

# Test all functionality
node scripts-v2/test-full-flow.js
```

### Step 6.2: Mainnet Preparation

```bash
# Final audit review
# Multi-sig setup
# Emergency procedures
# Monitoring setup
```

### Step 6.3: Mainnet Launch

```bash
# Deploy to Polygon
npm run deploy:mainnet

# Verify contracts
npm run verify

# Initialize protocol
node scripts-v2/initialize-mainnet.js

# Monitor for 24 hours
```

---

## 📋 Phase 7: Post-Launch (Week 8+)

### Step 7.1: Monitoring

- Setup Grafana dashboards
- Configure alerts (PagerDuty)
- Monitor gas usage
- Track TVL and volume

### Step 7.2: Community

- Launch Discord
- Start Twitter marketing
- Create documentation
- Run community calls

### Step 7.3: Governance

- Deploy ORX tokens
- Enable veORX staking
- First governance proposal
- DAO activation

---

## 🔧 Development Tools

### Required Tools

```bash
# Hardhat
npm install --save-dev hardhat

# Testing
npm install --save-dev @nomicfoundation/hardhat-chai-matchers
npm install --save-dev @nomicfoundation/hardhat-network-helpers

# Security
npm install --save-dev slither-analyzer
pip3 install mythril

# Linting
npm install --save-dev eslint prettier solhint
```

### Recommended VS Code Extensions

- Solidity (Juan Blanco)
- Hardhat Solidity
- ESLint
- Prettier
- GitLens

---

## 📊 Success Metrics

### Technical Metrics

- ✅ 100% test coverage
- ✅ 0 critical security issues
- ✅ < 24KB contract sizes
- ✅ < 500k gas per transaction
- ✅ 99.9% uptime

### Business Metrics

- 🎯 $1M+ TVL in first month
- 🎯 1000+ unique traders
- 🎯 100+ active markets
- 🎯 $100k+ trading volume/day
- 🎯 10k+ Discord members

---

## 🚨 Common Issues & Solutions

### Issue 1: Contract Size Too Large

```solidity
// Solution: Use libraries
library MathLib {
    function calculate() internal pure returns (uint256) {
        // Complex math here
    }
}

contract MyContract {
    using MathLib for uint256;
}
```

### Issue 2: Gas Costs Too High

```solidity
// Solution: Optimize storage
// Use uint256 instead of uint8 (packing)
// Batch operations
// Use events instead of storage
```

### Issue 3: Chainlink Functions Timeout

```javascript
// Solution: Reduce API calls
// Cache data
// Use faster APIs
// Increase gas limit
```

---

## 📚 Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Chainlink Functions](https://docs.chain.link/chainlink-functions)
- [The Graph](https://thegraph.com/docs)
- [Polygon Documentation](https://docs.polygon.technology)

---

## 🤝 Support

- **Discord**: https://discord.gg/oraclex
- **Email**: dev@oraclex.io
- **GitHub Issues**: https://github.com/oraclex/oraclex-v2/issues

---

**Last Updated**: 2024-11-21  
**Version**: 2.0.0  
**Status**: Implementation Ready
