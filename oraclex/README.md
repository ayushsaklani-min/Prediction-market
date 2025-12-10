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

### Deploy All Contracts

```bash
npx hardhat run scripts-v2/deploy-v2.js --network amoy --config hardhat-v2.config.js
```

### Deploy Fresh System

```bash
npx hardhat run scripts-v2/deploy-all-fresh.js --network amoy --config hardhat-v2.config.js
```

### Create Demo Markets

```bash
npx hardhat run scripts-v2/create-demo-markets.js --network amoy --config hardhat-v2.config.js
```

## 🎮 Usage

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

## 📝 Smart Contracts

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

## 🧪 Testing

```bash
# Run all tests
npx hardhat test --config hardhat-v2.config.js

# Run specific test
npx hardhat test test-v2/ORXToken.test.js --config hardhat-v2.config.js

# Coverage
npx hardhat coverage --config hardhat-v2.config.js
```

## 📊 Project Structure

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

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [oraclex.io](https://oraclex.io)
- **Documentation**: [docs.oraclex.io](https://docs.oraclex.io)
- **Twitter**: [@OracleX](https://twitter.com/oraclex)
- **Discord**: [Join our community](https://discord.gg/oraclex)

## 🙏 Acknowledgments

- OpenZeppelin for secure contract libraries
- Polygon for zkEVM infrastructure
- The Graph for indexing protocol
- Chainlink for oracle services

---

Built with ❤️ by the OracleX Team
