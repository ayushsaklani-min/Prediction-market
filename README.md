# 🔮 OracleX - Decentralized Forecasting Protocol

> **Status:** Live on Polygon Mainnet (Test Mode)
> **Version:** v2.0.0 (Beta)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Network: Polygon](https://img.shields.io/badge/Network-Polygon%20Mainnet-8247E5)](https://polygon.technology/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)

## Protocol Overview

OracleX is a decentralized prediction market protocol built on Polygon. It utilizes an Automated Market Maker (AMM) for instant liquidity and verifiable AI agents for market resolution. The protocol allows users to trade positions on future events with a focus on institutional-grade security and transparent settlement.

---

## � Mainnet Deployment

**User Interface:** [https://zkevm-eta.vercel.app](https://zkevm-eta.vercel.app)

### Smart Contract Registry (Chain ID: 137)

| Contract | Address | Explorer |
|----------|---------|----------|
| **Prediction AMM** | `0xB1B67563960fDD68BadeEb769Bf9b5A3D39aa81A` | [View ↗](https://polygonscan.com/address/0xB1B67563960fDD68BadeEb769Bf9b5A3D39aa81A) |
| **Market Factory** | `0x34a4d275549F4B243427793d7dd07A3DC8b7358E` | [View ↗](https://polygonscan.com/address/0x34a4d275549F4B243427793d7dd07A3DC8b7358E) |
| **Oracle Adapter** | `0x695Bb36D976629E6d46C8E1E1De24C1dCD4Fa517` | [View ↗](https://polygonscan.com/address/0x695Bb36D976629E6d46C8E1E1De24C1dCD4Fa517) |
| **Notifier/Verifier** | `0x862eD35DBA824AfB27564d8ad3A3D7cF1302D0Ca` | [View ↗](https://polygonscan.com/address/0x862eD35DBA824AfB27564d8ad3A3D7cF1302D0Ca) |
| **ORX Token** | `0x1D2306f42DB68Ac09d1305b98C63ca3F997076bD` | [View ↗](https://polygonscan.com/address/0x1D2306f42DB68Ac09d1305b98C63ca3F997076bD) |
| **veORX (Staking)** | `0x2C61bc6be0741256dde76a42Fc143D6709737656` | [View ↗](https://polygonscan.com/address/0x2C61bc6be0741256dde76a42Fc143D6709737656) |
| **Treasury** | `0xEB0F09C0817F75Be039275f3E3C93CdAc3FF3fc5` | [View ↗](https://polygonscan.com/address/0xEB0F09C0817F75Be039275f3E3C93CdAc3FF3fc5) |
| **TestUSDC** | `0x6aFC2AD966a9DbB7D595D54F81AC924419f816c6` | [View ↗](https://polygonscan.com/address/0x6aFC2AD966a9DbB7D595D54F81AC924419f816c6) |

> **Note:** The current deployment uses **TestUSDC** for settlement to allow risk-free testing on the mainnet environment.
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
    *   **TestUSDC:** Mintable via the [Etherscan Write Contract](https://polygonscan.com/address/0x6aFC2AD966a9DbB7D595D54F81AC924419f816c6#writeContract) interface (function `mint`).
3.  **Launch App:** Navigate to [zkevm-eta.vercel.app](https://zkevm-eta.vercel.app).

---

## 📄 License

This project is licensed under the MIT License.
