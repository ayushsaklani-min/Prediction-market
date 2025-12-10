# 🔮 OracleX

> Decentralized Prediction Markets powered by AI Oracles on Polygon zkEVM

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)

## 🌟 Overview

OracleX is a next-generation prediction market platform that combines decentralized finance with AI-powered oracles. Users can create markets, trade on outcomes, and participate in governance using veORX tokens.

### Key Features

- 🎯 **Prediction Markets** - Create and trade on any future event
- 🤖 **AI Oracle Integration** - Automated settlement using AI verification
- 💰 **AMM Trading** - Efficient automated market maker for price discovery
- 🗳️ **DAO Governance** - Community-driven protocol decisions
- 🔒 **Vote Escrow** - Lock ORX tokens for voting power and rewards
- 📊 **Analytics Dashboard** - Track markets, positions, and performance

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  Markets • Trading • Portfolio • Governance • Analytics  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                  Smart Contracts (Solidity)              │
├──────────────────────────────────────────────────────────┤
│  • MarketFactory  • PredictionAMM  • MarketPositions    │
│  • OracleAdapter  • Verifier       • Treasury           │
│  • ORXToken       • veORX          • Governance         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│              Backend Services & Indexing                 │
│  • Oracle Backend  • The Graph Subgraph  • Supabase     │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/oraclex.git
cd oraclex

# Install dependencies
npm install

# Install frontend dependencies
cd frontend-v2
npm install
cd ..
```

### Configuration

1. Copy environment variables:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration:
```env
PRIVATE_KEY=your_private_key
INFURA_API_KEY=your_infura_key
POLYGONSCAN_API_KEY=your_polygonscan_key
```

3. Configure frontend environment:
```bash
cd frontend-v2
cp .env.example .env.local
```

### Development

```bash
# Compile contracts
npx hardhat compile --config hardhat-v2.config.js

# Run tests
npx hardhat test --config hardhat-v2.config.js

# Start frontend
cd frontend-v2
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📦 Deployment

### Smart Contracts

Deploy all contracts to Polygon Amoy testnet:

```bash
npx hardhat run scripts-v2/deploy-all-fresh.js --network amoy --config hardhat-v2.config.js
```

Create demo markets:

```bash
npx hardhat run scripts-v2/create-demo-markets.js --network amoy --config hardhat-v2.config.js
```

### Frontend (Vercel)

1. **Connect Repository**: Import your GitHub repo to Vercel
2. **Configure Build Settings**:
   - Framework Preset: `Next.js`
   - Root Directory: `oraclex/frontend-v2`
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. **Environment Variables**: Add these in Vercel dashboard:
   ```
   NEXT_PUBLIC_CHAIN_ID=80002
   NEXT_PUBLIC_RPC_URL=https://rpc-amoy.polygon.technology
   NEXT_PUBLIC_EXPLORER_URL=https://amoy.polygonscan.com
   NEXT_PUBLIC_ORX_TOKEN=0xf5f5424A78657E374F1018307c07323696e3A6b3
   NEXT_PUBLIC_VEORX=0xEcde5DC1B5e9634c5f58F3F0E016De734EccBfFE
   NEXT_PUBLIC_MARKET_POSITIONS=0x9F12Bd26E6BA262dcC2c001400F8a7E82BfE589A
   NEXT_PUBLIC_PREDICTION_AMM=0x940221fCE2573E99024efEd0369E8ee58e2535a1
   NEXT_PUBLIC_MARKET_FACTORY=0xd7CB165Ef5B95De40cEdC323Bfe69ce546fB7731
   NEXT_PUBLIC_ORACLE_ADAPTER=0x954f60a82553CAF9Ec8e6e4F44F6Fc7e2479a792
   NEXT_PUBLIC_VERIFIER=0xf72d7F9Ee81264fb43da8b0D1fbB17F73DD66Fe4
   NEXT_PUBLIC_GOVERNANCE=0x4C5017777e234E716c7e44FbFF75ee394646DD16
   NEXT_PUBLIC_TREASURY=0xE0880C17bE8c6c5dd5611440299A4e5d223a488f
   NEXT_PUBLIC_FEE_DISTRIBUTOR=0x53756cfd49Cc9354C10cafddD0d6a63Fe77a6bdf
   NEXT_PUBLIC_USDC=0x170490a94B901237bc5425f965ecEF111DEECcE1
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   NEXT_PUBLIC_ENABLE_GOVERNANCE=true
   ```
4. **Deploy**: Click "Deploy" - Vercel will auto-deploy on every push to main

### Backend (Render)

1. **Connect Repository**: Create new Web Service on Render
2. **Configure Service**:
   - Name: `oraclex-backend`
   - Root Directory: `oraclex`
   - Build Command: `npm ci`
   - Start Command: `npm run start:backend`
   - Node Version: `18`
3. **Environment Variables**: Add these in Render dashboard:
   ```
   NODE_ENV=production
   PRIVATE_KEY=your_private_key
   RPC_URL=https://rpc-amoy.polygon.technology
   USDC_ADDRESS=0x170490a94B901237bc5425f965ecEF111DEECcE1
   BACKEND_PORT=4000
   WS_PORT=4001
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_ANON_KEY=your_anon_key
   ```
4. **Deploy**: Render will auto-deploy from your `render.yaml` configuration

> **Note**: After backend deploys, update frontend env vars with backend URL:
> - `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
> - `NEXT_PUBLIC_WS_URL=wss://your-backend.onrender.com`

##  Usage

### Creating a Market

```javascript
// Using the frontend
1. Connect your wallet
2. Navigate to "Create Market"
3. Enter market details (question, end date, category)
4. Approve USDC and create market

// Using scripts
npx hardhat run scripts-v2/create-one-market.js --network amoy --config hardhat-v2.config.js
```

### Trading

```javascript
1. Browse available markets
2. Select a market
3. Choose YES or NO outcome
4. Enter amount and confirm trade
5. Track your position in Portfolio
```

### Governance

```javascript
// Lock ORX for voting power
npx hardhat run scripts-v2/lock-orx-for-voting.js --network amoy --config hardhat-v2.config.js

// Create a proposal
npx hardhat run scripts-v2/create-proposal-now.js --network amoy --config hardhat-v2.config.js

// List all proposals
npx hardhat run scripts-v2/list-proposals.js --network amoy --config hardhat-v2.config.js
```

##  Smart Contracts

### Core Contracts

| Contract | Description | Address |
|----------|-------------|---------|
| ORXToken | Governance token | `0xf5f5...A6b3` |
| veORX | Vote-escrowed ORX | `0xEcde...BfFE` |
| SimpleGovernance | DAO governance | `0x4C50...DD16` |
| MarketFactoryV2 | Market creation | `0xd7CB...7731` |
| PredictionAMM | Trading engine | `0x9402...5a1` |
| MarketPositions | Position tracking | `0x9F12...589A` |
| OracleAdapterV2 | Oracle integration | `0x954f...a792` |
| VerifierV2 | Result verification | `0xf72d...66Fe4` |
| Treasury | Protocol treasury | `0xE088...488f` |
| FeeDistributor | Fee distribution | `0x5375...6bdf` |

*Deployed on Polygon Amoy Testnet*

## 🛠️ Technology Stack

- **Smart Contracts**: Solidity 0.8.24, Hardhat, OpenZeppelin
- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **Web3**: Wagmi, Viem, RainbowKit
- **Indexing**: The Graph Protocol
- **Backend**: Node.js, Express, Supabase
- **Oracle**: Chainlink Functions (planned)

##  Testing

```bash
# Run all tests
npx hardhat test --config hardhat-v2.config.js

# Run specific test
npx hardhat test test-v2/ORXToken.test.js --config hardhat-v2.config.js

# Coverage
npx hardhat coverage --config hardhat-v2.config.js
```

##  Project Structure

```
oraclex/
├── contracts-v2/          # Smart contracts
├── scripts-v2/            # Deployment scripts
├── frontend-v2/           # Next.js application
│   ├── app/              # Pages and routes
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   └── lib/              # Utilities and ABIs
├── backend/              # Oracle backend services
├── subgraph/             # The Graph indexing
└── supabase/             # Database schema
```

##  Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


##  Acknowledgments

- OpenZeppelin for secure contract libraries
- Polygon for zkEVM infrastructure
- The Graph for indexing protocol
- Chainlink for oracle services

## 🚀 Quick Deployment Guide

### 1. Fork & Clone
```bash
git clone https://github.com/ayushsaklani-min/ZKEVM.git
cd ZKEVM/oraclex
```

### 2. Install Dependencies
```bash
npm install
cd frontend-v2 && npm install && cd ..
```

### 3. Deploy to Vercel (Frontend)
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Set root directory to `oraclex/frontend-v2`
- Add environment variables from `.env.example`
- Deploy!

### 4. Deploy to Render (Backend)
- Go to [render.com](https://render.com)
- Create new Web Service
- Connect your GitHub repository
- Render will auto-detect `render.yaml`
- Add environment variables
- Deploy!

### 5. Update Frontend with Backend URL
After backend deploys, update these in Vercel:
- `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
- `NEXT_PUBLIC_WS_URL=wss://your-backend.onrender.com`

---

Built for Polygon by ayushsaklani
