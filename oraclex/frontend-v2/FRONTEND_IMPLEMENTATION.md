# OracleX V2 Frontend - Complete Implementation Guide

## 🎉 What's Been Created

### ✅ Core Setup (Complete)
- `package.json` - All dependencies (Next.js 15, Wagmi v2, RainbowKit, TanStack Query)
- `next.config.js` - Optimized Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Custom theme with YES/NO colors
- `.env.example` - Environment variables template

### ✅ Configuration (Complete)
- `config/contracts.ts` - Contract addresses and chain config
- `config/wagmi.ts` - Wagmi/RainbowKit setup
- `types/index.ts` - Complete TypeScript types

### ✅ Utilities (Complete)
- `lib/utils.ts` - Formatting, calculations, helpers
- `lib/abis.ts` - Contract ABIs for all V2 contracts

### ✅ Hooks (Complete)
- `hooks/useMarkets.ts` - Market data fetching
- `hooks/useTrading.ts` - Buy/sell/redeem functions

### ✅ UI Components (Complete)
- `components/ui/button.tsx` - Button with YES/NO variants
- `components/ui/card.tsx` - Card components
- `components/layout/Header.tsx` - Navigation header
- `components/ThemeToggle.tsx` - Dark/light mode toggle

### ✅ Pages (Partial)
- `app/layout.tsx` - Root layout with providers
- `app/providers.tsx` - Wagmi + React Query providers
- `app/globals.css` - Global styles with dark mode
- `app/page.tsx` - Home page with market explorer
- `components/markets/MarketCard.tsx` - Market card component

---

## 📋 Remaining Components to Create

### 1. Market Components
```typescript
// components/markets/MarketSearch.tsx
- Search input with debounce
- Real-time filtering

// components/markets/MarketFilters.tsx
- Category dropdown
- Status filter (Active/Settled/Closing)
- Sort options

// components/markets/PriceChart.tsx
- Recharts line chart
- YES/NO price history
- Volume bars

// components/markets/OrderBook.tsx
- Buy/sell orders
- Price levels
- Depth visualization
```

### 2. Trading Components
```typescript
// components/trading/TradingInterface.tsx
- Buy/Sell tabs
- Amount input
- Slippage settings
- Gas estimation
- Confirm button

// components/trading/PositionCard.tsx
- User's YES/NO positions
- Current value
- PnL display
- Sell button

// components/trading/LiquidityPanel.tsx
- Pool composition
- Add/remove liquidity
- LP rewards
```

### 3. UI Components (ShadCN)
```typescript
// components/ui/badge.tsx
// components/ui/progress.tsx
// components/ui/skeleton.tsx
// components/ui/tabs.tsx
// components/ui/input.tsx
// components/ui/select.tsx
// components/ui/dialog.tsx
// components/ui/dropdown-menu.tsx
// components/ui/tooltip.tsx
```

### 4. Pages to Create

#### Market Detail Page
```typescript
// app/markets/[marketId]/page.tsx
export default function MarketPage({ params }: { params: { marketId: string } }) {
  return (
    <div className="container py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Market Info + Chart */}
        <div className="lg:col-span-2 space-y-6">
          <MarketHeader market={market} />
          <PriceChart marketId={marketId} />
          <MarketDescription market={market} />
          <AIInsights market={market} />
        </div>
        
        {/* Right: Trading Interface */}
        <div className="space-y-6">
          <TradingInterface marketId={marketId} />
          <YourPositions marketId={marketId} />
          <MarketStats market={market} />
        </div>
      </div>
      
      {/* Bottom: Activity Feed */}
      <div className="mt-8">
        <RecentTrades marketId={marketId} />
      </div>
    </div>
  );
}
```

#### Portfolio Page
```typescript
// app/portfolio/page.tsx
export default function PortfolioPage() {
  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">Your Portfolio</h1>
      
      <div className="grid gap-6 lg:grid-cols-4">
        <StatsCard title="Total Value" value="$1,234.56" />
        <StatsCard title="Realized PnL" value="+$234.56" positive />
        <StatsCard title="Unrealized PnL" value="-$45.23" negative />
        <StatsCard title="Win Rate" value="67%" />
      </div>
      
      <Tabs defaultValue="active" className="mt-8">
        <TabsList>
          <TabsTrigger value="active">Active Positions</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <ActivePositions />
        </TabsContent>
        
        <TabsContent value="history">
          <TradeHistory />
        </TabsContent>
        
        <TabsContent value="rewards">
          <RewardsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### Create Market Page
```typescript
// app/create/page.tsx
export default function CreateMarketPage() {
  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-8 text-3xl font-bold">Create Market</h1>
      
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div>
            <Label>Event Description</Label>
            <Input placeholder="Will ETH reach $5000 by Dec 31, 2024?" />
            <AITitleSuggestions />
          </div>
          
          <div>
            <Label>Category</Label>
            <CategorySelect />
          </div>
          
          <div>
            <Label>Tags</Label>
            <TagInput />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Close Date</Label>
              <DatePicker />
            </div>
            <div>
              <Label>Resolution Date</Label>
              <DatePicker />
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Initial YES Liquidity</Label>
              <Input type="number" placeholder="100" />
            </div>
            <div>
              <Label>Initial NO Liquidity</Label>
              <Input type="number" placeholder="100" />
            </div>
          </div>
          
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Estimated Costs</h3>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Creation Fee</span>
                <span>10 USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Initial Liquidity</span>
                <span>200 USDC</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>210 USDC</span>
              </div>
            </div>
          </div>
          
          <Button className="w-full" size="lg">
            Create Market
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Governance Page
```typescript
// app/governance/page.tsx
export default function GovernancePage() {
  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Governance</h1>
        <Button>Create Proposal</Button>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Your veORX</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,234.56</div>
            <p className="text-sm text-muted-foreground">Voting Power</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Locked ORX</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">10,000</div>
            <p className="text-sm text-muted-foreground">Until Dec 31, 2024</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Claimable Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$234.56</div>
            <Button className="mt-2 w-full" size="sm">Claim</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
            <p className="text-sm text-muted-foreground">Vote now</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="passed">Passed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            <ProposalList status="active" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd oraclex/frontend-v2
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your contract addresses
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📦 Missing ShadCN Components

Install these ShadCN components:

```bash
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add label
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add slider
```

---

## 🎨 Design System

### Colors
- **YES**: `#10b981` (green)
- **NO**: `#ef4444` (red)
- **Primary**: Dynamic based on theme
- **Background**: Dark/Light mode support

### Typography
- **Font**: Inter
- **Headings**: Bold, tracking-tight
- **Body**: Regular, comfortable line-height

### Spacing
- **Container**: Max-width with padding
- **Cards**: Rounded-lg with shadow
- **Gaps**: Consistent 4/6/8 spacing

---

## 🔌 API Integration

### The Graph Queries
```typescript
// lib/graphql/queries.ts
export const GET_MARKETS = gql`
  query GetMarkets($first: Int!, $skip: Int!) {
    markets(first: $first, skip: $skip, orderBy: totalVolume, orderDirection: desc) {
      id
      marketId
      description
      category
      yesPool
      noPool
      totalVolume
      status
    }
  }
`;
```

### REST API
```typescript
// lib/api/client.ts
export async function fetchMarketData(marketId: string) {
  const response = await fetch(`${API_URL}/markets/${marketId}`);
  return response.json();
}
```

---

## 📱 Mobile Optimization

- **Responsive Grid**: 1 col mobile, 2 col tablet, 3 col desktop
- **Touch Targets**: Minimum 44x44px
- **Bottom Navigation**: Mobile-friendly nav
- **Swipe Gestures**: For tabs and cards
- **Optimized Images**: WebP with fallbacks

---

## ⚡ Performance

- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next/Image component
- **Lazy Loading**: React.lazy for heavy components
- **Caching**: React Query with stale-while-revalidate
- **Bundle Size**: < 200KB initial load

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## 📚 Next Steps

1. **Complete UI Components** - Add all ShadCN components
2. **Implement Pages** - Create all remaining pages
3. **Add Charts** - Integrate Recharts for price history
4. **Real-time Updates** - WebSocket integration
5. **Testing** - Add comprehensive tests
6. **Optimization** - Performance tuning
7. **Documentation** - User guides

---

**Status**: 🟡 Core infrastructure complete, pages in progress  
**Completion**: ~40% (Core setup done, pages need implementation)  
**Next Priority**: Complete market detail page and trading interface
