# 🔮 OracleX - Decentralized Forecasting Protocol

> **Status:** Beta deployment on Polygon Mainnet
> **Version:** v2.0.0 (Beta)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Network: Polygon](https://img.shields.io/badge/Network-Polygon%20Mainnet-8247E5)](https://polygon.technology/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)

## Protocol Overview

OracleX is a decentralized prediction market protocol built on Polygon. It uses an Automated Market Maker (AMM) for instant liquidity and a proof-gated oracle resolution flow that is currently in beta. The protocol allows users to trade positions on future events with transparent settlement rules.

---

## � Mainnet Deployment

**User Interface:** [https://zkevm-eta.vercel.app](https://zkevm-eta.vercel.app)

### Smart Contract Registry (Chain ID: 137)

| Contract | Address | Explorer |
|----------|---------|----------|
| **Prediction AMM** | `0xAD8dC6ca24038Af23E2f2Ea7A07B588cF04F4213` | [View ↗](https://polygonscan.com/address/0xAD8dC6ca24038Af23E2f2Ea7A07B588cF04F4213) |
| **Market Factory** | `0xfCD154BD714f4b9DDd271B8bdD1fF3d427333dEf` | [View ↗](https://polygonscan.com/address/0xfCD154BD714f4b9DDd271B8bdD1fF3d427333dEf) |
| **Oracle Adapter** | `0xd45284283A8D0BDD15728859B12E9EBBF2630c10` | [View ↗](https://polygonscan.com/address/0xd45284283A8D0BDD15728859B12E9EBBF2630c10) |
| **Notifier/Verifier** | `0xd619b6C8c24fBcC1A764B4e11175DB7B8Caad2a7` | [View ↗](https://polygonscan.com/address/0xd619b6C8c24fBcC1A764B4e11175DB7B8Caad2a7) |
| **ORX Token** | `0x1D2306f42DB68Ac09d1305b98C63ca3F997076bD` | [View ↗](https://polygonscan.com/address/0x1D2306f42DB68Ac09d1305b98C63ca3F997076bD) |
| **veORX (Staking)** | `0x2C61bc6be0741256dde76a42Fc143D6709737656` | [View ↗](https://polygonscan.com/address/0x2C61bc6be0741256dde76a42Fc143D6709737656) |
| **Treasury** | `0x9F275918503c4fdABe4FE2BF6365EeE6D2De0664` | [View ↗](https://polygonscan.com/address/0x9F275918503c4fdABe4FE2BF6365EeE6D2De0664) |
| **TestUSDC** | `0x6aFC2AD966a9DbB7D595D54F81AC924419f816c6` | [View ↗](https://polygonscan.com/address/0x6aFC2AD966a9DbB7D595D54F81AC924419f816c6) |

> **Note:** The current deployment uses **TestUSDC** for settlement to allow risk-free testing on mainnet. This is not a production real-value market configuration.
>
> 🔹 **Get Free TestUSDC:** Mint tokens via the [PolygonScan Explorer](https://polygonscan.com/address/0x6aFC2AD966a9DbB7D595D54F81AC924419f816c6#writeContract) (Connect Web3 -> Write `mint` function).
> 🔹 **Launch App:** [zkevm-eta.vercel.app](https://zkevm-eta.vercel.app)

---

## � Technical Roadmap

We are actively developing the following core upgrades to transition from a beta application to a robust forecasting infrastructure.

### 1. Multi-path Oracle Resolution
*Implementation of a decentralized consensus mechanism for market settlement.*
*   **Quorum System:** Resolution requires agreement from independent AI agents and Chainlink feeds.
*   **On-Chain Verification:** Data sources and confidence scores are published on-chain.
*   **Dispute Mechanism:** Bonded challengers can dispute results, triggering a DAO fallback vote.

### 2. Advanced Market Structures
*Expanding reliable market types beyond binary options.*
*   **Scalar Markets:** Numerical range predictions (e.g., Asset Prices, Temperature).
*   **Categorical Markets:** Single-winner selection from multiple mutually exclusive outcomes.
*   **Time-Weighted Markets:** Settlement based on TWAP (Time-Weighted Average Price) outcomes.

### 3. AMM v2 Specifications
*Optimizing capital efficiency and market stability.*
*   **Dynamic Fee Model:** Trading fees automatically adjust based on localized volatility.
*   **Liquidity Depth Pricing:** Algorithmic curves to minimize slippage in thin markets.
*   **LMSR Integration:** Optional backend support for Logarithmic Market Scoring Rules.

### 4. Protocol Incentives
*Sustainable economic models for liquidity provision.*
*   **veORX Boosting:** Multipliers on LP rewards for long-term token lockers.
*   **Creator Royalties:** Configurable fee sharing for market creators.
*   **Bootstrapping Rebates:** Fee rebates for initial liquidity providers.

### 5. Governance Security
*Hardening the protocol against governance attacks.*
*   **Dual DAO Architecture:** Separation of technical "Oracle DAO" and parameter-setting "Protocol DAO".
*   **Execution Timelocks:** Mandatory delays for critical parameter changes.
*   **Security Council:** Emergency veto powers for malicious proposals.

### 6. Risk Management Layer
*Automated safety features for user protection.*
*   **Exposure Caps:** Protocol-level limits on maximum open interest per market.
*   **Circuit Breakers:** Automatic trading pauses upon detection of oracle anomalies.
*   **Per-Market Insurance:** Isolated insurance funds for settlement failures.

### 7. User Experience Enhancements
*Data-rich interfaces for traders.*
*   **Historical Analytics:** Dashboards tracking oracle accuracy and resolution times.
*   **Market Depth Charts:** Visualization of liquidity concentration.
*   **Pro Mode:** Advanced trading terminal interface.

### 8. Compliance Architecture
*Features for regulatory adaptability.*
*   **Geo-Fencing Hooks:** Frontend support for jurisdiction-based access restriction.
*   **Permissioned Pools:** Optional KYC gating for institutional markets.
*   **Non-Custodial Logic:** Strict separation of user funds from protocol treasury.

### 9. Developer Ecosystem
*Tools for third-party integration.*
*   **OracleX SDK:** TypeScript libraries for market creation and trading.
*   **Subgraph Index:** Public GraphQL endpoint for real-time market data.
*   **Builder API:** REST endpoints for automated market management.

---

## ⚡ Quick Start

To interact with the protocol on Polygon Mainnet:

1.  **Configure Wallet:** Ensure MetaMask is connected to Polygon Mainnet (Chain ID 137).
2.  **Acquire Assets:**
    *   **MATIC:** Required for gas fees.
    *   **TestUSDC:** Mintable via the [PolygonScan Write Contract](https://polygonscan.com/address/0x6aFC2AD966a9DbB7D595D54F81AC924419f816c6#writeContract) interface (function `mint`).
3.  **Launch App:** Navigate to [zkevm-eta.vercel.app](https://zkevm-eta.vercel.app).

---

## 📄 License

This project is licensed under the MIT License.



