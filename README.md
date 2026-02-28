# OracleX - Decentralized Forecasting Protocol

Status: Beta deployment on Polygon Mainnet  
Version: v2.0.0 (Beta)

## Protocol Overview

OracleX is a decentralized prediction market protocol on Polygon. It combines an AMM-based trading engine with a proof-gated oracle resolution flow. The current deployment is intended for beta testing and validation.

## Mainnet Deployment

User Interface: https://zkevm-eta.vercel.app

### Smart Contract Registry (Chain ID: 137)

| Contract | Address | Explorer |
|----------|---------|----------|
| Prediction AMM | `0xAD8dC6ca24038Af23E2f2Ea7A07B588cF04F4213` | https://polygonscan.com/address/0xAD8dC6ca24038Af23E2f2Ea7A07B588cF04F4213 |
| Market Factory | `0xfCD154BD714f4b9DDd271B8bdD1fF3d427333dEf` | https://polygonscan.com/address/0xfCD154BD714f4b9DDd271B8bdD1fF3d427333dEf |
| Oracle Adapter | `0xd45284283A8D0BDD15728859B12E9EBBF2630c10` | https://polygonscan.com/address/0xd45284283A8D0BDD15728859B12E9EBBF2630c10 |
| Notifier/Verifier | `0xd619b6C8c24fBcC1A764B4e11175DB7B8Caad2a7` | https://polygonscan.com/address/0xd619b6C8c24fBcC1A764B4e11175DB7B8Caad2a7 |
| ORX Token | `0x1D2306f42DB68Ac09d1305b98C63ca3F997076bD` | https://polygonscan.com/address/0x1D2306f42DB68Ac09d1305b98C63ca3F997076bD |
| veORX | `0x2C61bc6be0741256dde76a42Fc143D6709737656` | https://polygonscan.com/address/0x2C61bc6be0741256dde76a42Fc143D6709737656 |
| Treasury | `0x9F275918503c4fdABe4FE2BF6365EeE6D2De0664` | https://polygonscan.com/address/0x9F275918503c4fdABe4FE2BF6365EeE6D2De0664 |
| TestUSDC | `0x6aFC2AD966a9DbB7D595D54F81AC924419f816c6` | https://polygonscan.com/address/0x6aFC2AD966a9DbB7D595D54F81AC924419f816c6 |

Note: this deployment uses TestUSDC for risk-free beta testing and is not configured as a production real-value market.

Get TestUSDC: https://polygonscan.com/address/0x6aFC2AD966a9DbB7D595D54F81AC924419f816c6#writeContract

## Quick Start

1. Connect your wallet to Polygon Mainnet (Chain ID 137).
2. Get MATIC for gas.
3. Mint TestUSDC using the writeContract `mint` function on PolygonScan.
4. Open the app: https://zkevm-eta.vercel.app

## License

MIT
