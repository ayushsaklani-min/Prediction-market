# Migration Guide: OracleX V1 → V2

## 🎯 Overview

This guide helps you migrate from the current OracleX MVP (V1) to the production-ready V2 protocol.

---

## 📋 Pre-Migration Checklist

- [ ] Backup all V1 data
- [ ] Export market information
- [ ] Document user positions
- [ ] Save transaction history
- [ ] Test V2 on testnet
- [ ] Prepare communication plan

---

## 🔄 Migration Strategy

### Option 1: Fresh Start (Recommended)

**Pros**: Clean slate, no legacy issues  
**Cons**: Users must create new positions

1. Deploy V2 contracts
2. Announce migration timeline
3. Allow V1 withdrawal period (2 weeks)
4. Settle all V1 markets
5. Launch V2 with new markets

### Option 2: Data Migration

**Pros**: Preserve user history  
**Cons**: Complex, potential issues

1. Export V1 data
2. Deploy V2 contracts
3. Migrate user balances
4. Recreate active markets
5. Verify all data

---

## 📊 Data Migration

### Export V1 Data

```javascript
// Export markets
const markets = await fetch('https://api-v1.oraclex.io/markets');
const marketData = await markets.json();
fs.writeFileSync('v1-markets.json', JSON.stringify(marketData, null, 2));

// Export user positions
const positions = await supabase
  .from('positions')
  .select('*');
fs.writeFileSync('v1-positions.json', JSON.stringify(positions, null, 2));
```

### Import to V2

```javascript
// Recreate markets in V2
for (const market of v1Markets) {
  await factoryV2.createMarket(
    market.eventId,
    market.description,
    getCategoryEnum(market.category),
    market.tags || [],
    market.closeTimestamp,
    market.resolutionTimestamp,
    ethers.parseUnits("100", 6), // Initial liquidity
    ethers.parseUnits("100", 6)
  );
}
```

---

## 🔧 Contract Changes

### V1 → V2 Mapping

| V1 Contract | V2 Contract | Changes |
|-------------|-------------|---------|
| OracleXMarketFactory | MarketFactoryV2 | + Categories, tags, fees |
| OracleXVault | PredictionAMM | Complete redesign (AMM) |
| OracleXVerifier | VerifierV2 | + Proof types, metadata |
| OracleXOracleAdapter | OracleAdapterV2 | + Disputes, reputation |
| N/A | ORXToken | New: Protocol token |
| N/A | veORX | New: Staking |
| N/A | MarketPositions | New: ERC1155 |
| N/A | Governance | New: DAO |
| N/A | Treasury | New: Treasury |
| N/A | FeeDistributor | New: Fees |

---

## 🔀 API Changes

### Market Creation

**V1**:
```javascript
POST /create-market
{
  "eventId": "...",
  "description": "...",
  "closeTimestamp": 123456789
}
```

**V2**:
```javascript
// Direct contract call
await factory.createMarket(
  eventId,
  description,
  category,
  tags,
  closeTimestamp,
  resolutionTimestamp,
  initialYes,
  initialNo
);
```

### Trading

**V1**:
```javascript
POST /deposit
{
  "marketId": "...",
  "side": 1,
  "amount": "100000000"
}
```

**V2**:
```javascript
// AMM buy
await amm.buy(
  marketId,
  side,
  amountIn,
  minSharesOut
);

// AMM sell
await amm.sell(
  marketId,
  side,
  sharesIn,
  minAmountOut
);
```

### Settlement

**V1**:
```javascript
POST /settle-market
{
  "marketId": "...",
  "winningSide": 1
}
```

**V2**:
```javascript
// Oracle proposes
await oracleAdapter.proposeOutcome(marketId, result, proof);

// 24hr challenge period

// Finalize
await oracleAdapter.finalizeOutcome(marketId);
```

---

## 💾 Database Schema Changes

### Markets Table

**V1**:
```sql
CREATE TABLE markets (
  market_id TEXT PRIMARY KEY,
  event_id TEXT,
  description TEXT,
  close_timestamp BIGINT,
  vault_address TEXT,
  probability INTEGER
);
```

**V2**:
```sql
CREATE TABLE markets (
  market_id BYTES32 PRIMARY KEY,
  event_id TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  close_timestamp BIGINT,
  resolution_timestamp BIGINT,
  vault_address TEXT,
  amm_address TEXT,
  position_token_address TEXT,
  ai_probability INTEGER,
  ai_confidence DECIMAL,
  ai_explanation TEXT,
  status TEXT,
  total_volume DECIMAL,
  total_liquidity DECIMAL
);
```

### New Tables in V2

```sql
-- Trades
CREATE TABLE trades (
  id UUID PRIMARY KEY,
  market_id BYTES32,
  trader_address TEXT,
  side SMALLINT,
  trade_type TEXT,
  amount_in DECIMAL,
  shares_out DECIMAL,
  price DECIMAL,
  fee DECIMAL,
  timestamp TIMESTAMP
);

-- Positions
CREATE TABLE positions (
  id UUID PRIMARY KEY,
  market_id BYTES32,
  user_address TEXT,
  side SMALLINT,
  shares DECIMAL,
  avg_entry_price DECIMAL,
  realized_pnl DECIMAL,
  unrealized_pnl DECIMAL
);

-- Proposals
CREATE TABLE proposals (
  id UUID PRIMARY KEY,
  proposal_id BIGINT,
  proposer_address TEXT,
  title TEXT,
  description TEXT,
  for_votes DECIMAL,
  against_votes DECIMAL,
  status TEXT
);
```

---

## 🎨 Frontend Changes

### Wallet Connection

**V1**:
```typescript
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
```

**V2**:
```typescript
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
```

### Contract Interactions

**V1**:
```typescript
// Direct API calls
const response = await fetch('/api/create-market', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

**V2**:
```typescript
// Direct contract calls
import { useWriteContract } from 'wagmi';

const { writeContract } = useWriteContract();

await writeContract({
  address: factoryAddress,
  abi: factoryAbi,
  functionName: 'createMarket',
  args: [...]
});
```

### State Management

**V1**:
```typescript
// Basic useState
const [markets, setMarkets] = useState([]);

useEffect(() => {
  fetch('/api/markets')
    .then(res => res.json())
    .then(setMarkets);
}, []);
```

**V2**:
```typescript
// TanStack Query
import { useQuery } from '@tanstack/react-query';

const { data: markets } = useQuery({
  queryKey: ['markets'],
  queryFn: fetchMarkets,
  refetchInterval: 10000
});
```

---

## 🔐 Security Improvements

### Access Control

**V1**:
```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "not owner");
    _;
}
```

**V2**:
```solidity
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

modifier onlyOperator() {
    require(hasRole(OPERATOR_ROLE, msg.sender), "not operator");
    _;
}
```

### Reentrancy Protection

**V1**:
```solidity
// No protection
function withdraw() external {
    uint256 amount = balances[msg.sender];
    balances[msg.sender] = 0;
    usdc.transfer(msg.sender, amount);
}
```

**V2**:
```solidity
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

function withdraw() external nonReentrant {
    uint256 amount = balances[msg.sender];
    balances[msg.sender] = 0;
    require(usdc.transfer(msg.sender, amount), "transfer failed");
}
```

---

## 🧪 Testing Migration

### Test V1 Functionality

```bash
# Test V1 contracts
cd oraclex
npm test

# Export data
node scripts/export-v1-data.js
```

### Test V2 Functionality

```bash
# Test V2 contracts
npm run compile
npm test

# Deploy to testnet
npm run deploy:testnet

# Test migration
node scripts-v2/test-migration.js
```

### Verify Data Integrity

```javascript
// Compare V1 and V2 data
const v1Markets = JSON.parse(fs.readFileSync('v1-markets.json'));
const v2Markets = await fetchV2Markets();

for (const v1Market of v1Markets) {
  const v2Market = v2Markets.find(m => m.eventId === v1Market.eventId);
  assert(v2Market, `Market ${v1Market.eventId} not found in V2`);
  assert.equal(v2Market.description, v1Market.description);
  // ... more checks
}
```

---

## 📢 Communication Plan

### Timeline

**Week -2**: Announce migration  
**Week -1**: Final testing  
**Week 0**: Deploy V2  
**Week 1**: Parallel operation  
**Week 2**: V1 shutdown  

### User Communication

**Email Template**:
```
Subject: OracleX V2 Launch - Action Required

Dear OracleX User,

We're excited to announce OracleX V2, a complete upgrade with:
- Real AI predictions
- Advanced trading (AMM)
- Protocol token (ORX)
- DAO governance

Action Required:
1. Withdraw from V1 markets by [DATE]
2. Connect wallet to V2 at app.oraclex.io
3. Start trading on V2

Questions? Join our Discord: discord.gg/oraclex

Thank you for being part of OracleX!
```

---

## 🚨 Rollback Plan

### If Migration Fails

1. **Pause V2 contracts**
   ```javascript
   await orxToken.pause();
   await amm.pause();
   await oracleAdapter.pause();
   ```

2. **Restore V1 service**
   ```bash
   # Redeploy V1 backend
   npm run start:backend

   # Restore database
   psql < v1-backup.sql
   ```

3. **Communicate to users**
   - Send email notification
   - Post on Discord/Twitter
   - Update status page

4. **Investigate issues**
   - Review logs
   - Check contract state
   - Identify root cause

5. **Fix and retry**
   - Deploy fixes
   - Test thoroughly
   - Schedule new migration

---

## ✅ Post-Migration Checklist

- [ ] All V1 markets settled
- [ ] All V1 funds withdrawn
- [ ] V2 contracts deployed
- [ ] V2 contracts verified
- [ ] Frontend updated
- [ ] Database migrated
- [ ] Monitoring active
- [ ] Users notified
- [ ] Documentation updated
- [ ] V1 deprecated

---

## 📊 Success Metrics

### Technical
- [ ] 100% data migrated
- [ ] 0 funds lost
- [ ] < 1hr downtime
- [ ] All tests passing

### Business
- [ ] 80%+ user migration
- [ ] Same or higher TVL
- [ ] Positive user feedback
- [ ] No critical bugs

---

## 🆘 Support

### During Migration

- **Discord**: #migration-support
- **Email**: support@oraclex.io
- **Status**: status.oraclex.io
- **Docs**: docs.oraclex.io/migration

### Emergency Contacts

- **Tech Lead**: tech@oraclex.io
- **Security**: security@oraclex.io
- **On-call**: +1-XXX-XXX-XXXX

---

**Last Updated**: 2024-11-21  
**Version**: 2.0.0  
**Status**: Ready for Migration
