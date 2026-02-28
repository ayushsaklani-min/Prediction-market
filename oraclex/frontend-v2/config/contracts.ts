import { Address } from 'viem';

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

function resolveAddress(value: string | undefined, fallback: Address): Address {
  if (value && ADDRESS_REGEX.test(value)) {
    return value as Address;
  }
  return fallback;
}

export const CONTRACTS = {
  ORXToken: resolveAddress(process.env.NEXT_PUBLIC_ORX_TOKEN, '0x1D2306f42DB68Ac09d1305b98C63ca3F997076bD'),
  veORX: resolveAddress(process.env.NEXT_PUBLIC_VEORX, '0x2C61bc6be0741256dde76a42Fc143D6709737656'),
  MarketPositions: resolveAddress(process.env.NEXT_PUBLIC_MARKET_POSITIONS, '0xA2B9d3C0557b344bc475fc0c0aCC2a25C74Fc2fE'),
  PredictionAMM: resolveAddress(process.env.NEXT_PUBLIC_PREDICTION_AMM, '0xAD8dC6ca24038Af23E2f2Ea7A07B588cF04F4213'),
  MarketFactory: resolveAddress(process.env.NEXT_PUBLIC_MARKET_FACTORY, '0xfCD154BD714f4b9DDd271B8bdD1fF3d427333dEf'),
  OracleAdapter: resolveAddress(process.env.NEXT_PUBLIC_ORACLE_ADAPTER, '0xd45284283A8D0BDD15728859B12E9EBBF2630c10'),
  Verifier: resolveAddress(process.env.NEXT_PUBLIC_VERIFIER, '0xd619b6C8c24fBcC1A764B4e11175DB7B8Caad2a7'),
  Governance: resolveAddress(process.env.NEXT_PUBLIC_GOVERNANCE, ZERO_ADDRESS),
  Treasury: resolveAddress(process.env.NEXT_PUBLIC_TREASURY, '0x9F275918503c4fdABe4FE2BF6365EeE6D2De0664'),
  FeeDistributor: resolveAddress(process.env.NEXT_PUBLIC_FEE_DISTRIBUTOR, '0xEFE71AaC7A7FF67CD9E7D7784B5d0eF35912e9A2'),
  USDC: resolveAddress(process.env.NEXT_PUBLIC_USDC, '0x6aFC2AD966a9DbB7D595D54F81AC924419f816c6'),
} as const;

export const isConfiguredAddress = (address: string | undefined): address is Address =>
  Boolean(address && ADDRESS_REGEX.test(address) && address.toLowerCase() !== ZERO_ADDRESS);

export const CHAIN_CONFIG = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 137,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://polygon-bor-rpc.publicnode.com',
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://polygonscan.com',
} as const;

export const API_CONFIG = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001',
  subgraphUrl: process.env.NEXT_PUBLIC_SUBGRAPH_URL || '',
  ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
} as const;

export const FEATURE_FLAGS = {
  enableGovernance: process.env.NEXT_PUBLIC_ENABLE_GOVERNANCE === 'true',
  enableAdmin: process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true',
} as const;
