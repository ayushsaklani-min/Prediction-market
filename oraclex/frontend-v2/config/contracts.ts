import { Address } from 'viem';

export const CONTRACTS = {
  ORXToken: process.env.NEXT_PUBLIC_ORX_TOKEN as Address,
  veORX: process.env.NEXT_PUBLIC_VEORX as Address,
  MarketPositions: process.env.NEXT_PUBLIC_MARKET_POSITIONS as Address,
  PredictionAMM: process.env.NEXT_PUBLIC_PREDICTION_AMM as Address,
  MarketFactory: process.env.NEXT_PUBLIC_MARKET_FACTORY as Address,
  OracleAdapter: process.env.NEXT_PUBLIC_ORACLE_ADAPTER as Address,
  Verifier: process.env.NEXT_PUBLIC_VERIFIER as Address,
  Governance: process.env.NEXT_PUBLIC_GOVERNANCE as Address,
  Treasury: process.env.NEXT_PUBLIC_TREASURY as Address,
  FeeDistributor: process.env.NEXT_PUBLIC_FEE_DISTRIBUTOR as Address,
  USDC: process.env.NEXT_PUBLIC_USDC as Address,
} as const;

export const CHAIN_CONFIG = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 137,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://polygon-rpc.com',
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://polygonscan.com',
} as const;

export const API_CONFIG = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.oraclex.io',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'wss://ws.oraclex.io',
  subgraphUrl: process.env.NEXT_PUBLIC_SUBGRAPH_URL || '',
  ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
} as const;

export const FEATURE_FLAGS = {
  enableGovernance: process.env.NEXT_PUBLIC_ENABLE_GOVERNANCE === 'true',
  enableAdmin: process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true',
} as const;
