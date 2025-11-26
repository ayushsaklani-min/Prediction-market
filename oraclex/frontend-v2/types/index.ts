import { Address } from 'viem';

export enum MarketCategory {
  Crypto = 0,
  Sports = 1,
  Politics = 2,
  Entertainment = 3,
  Science = 4,
  Other = 5,
}

export enum MarketStatus {
  Pending = 'pending',
  Active = 'active',
  Locked = 'locked',
  Disputed = 'disputed',
  Settled = 'settled',
}

export enum OutcomeStatus {
  None = 0,
  Proposed = 1,
  Challenged = 2,
  Finalized = 3,
}

export interface Market {
  marketId: string;
  eventId: string;
  description: string;
  category: MarketCategory;
  tags: string[];
  closeTimestamp: number;
  resolutionTimestamp: number;
  creator: Address;
  createdAt: number;
  active: boolean;
  
  // AMM data
  ammAddress?: Address;
  yesPool: bigint;
  noPool: bigint;
  totalVolume: bigint;
  totalLiquidity: bigint;
  
  // AI data
  aiProbability?: number;
  aiConfidence?: number;
  aiExplanation?: string;
  aiModelVersion?: string;
  
  // Settlement
  status: MarketStatus;
  winningSide?: 0 | 1;
  settledAt?: number;
  
  // Metadata
  imageUrl?: string;
  ipfsCid?: string;
}

export interface Position {
  marketId: string;
  userAddress: Address;
  side: 0 | 1; // 0 = NO, 1 = YES
  shares: bigint;
  avgEntryPrice: number;
  realizedPnl: bigint;
  unrealizedPnl: bigint;
  updatedAt: number;
}

export interface Trade {
  id: string;
  marketId: string;
  traderAddress: Address;
  side: 0 | 1;
  tradeType: 'buy' | 'sell';
  amountIn: bigint;
  sharesOut: bigint;
  price: number;
  fee: bigint;
  txHash: string;
  blockNumber: bigint;
  timestamp: number;
}

export interface Proposal {
  id: string;
  proposalId: bigint;
  proposer: Address;
  title: string;
  description: string;
  proposalType: 'parameter' | 'upgrade' | 'treasury';
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  quorumRequired: bigint;
  status: 'pending' | 'active' | 'succeeded' | 'defeated' | 'executed';
  startBlock: bigint;
  endBlock: bigint;
  executionEta?: bigint;
  createdAt: number;
  executedAt?: number;
}

export interface UserStats {
  totalVolume: bigint;
  totalTrades: number;
  winRate: number;
  realizedPnl: bigint;
  unrealizedPnl: bigint;
  activePositions: number;
  orxBalance: bigint;
  veOrxBalance: bigint;
  claimableRewards: bigint;
}

export interface ProtocolStats {
  totalValueLocked: bigint;
  volume24h: bigint;
  activeMarkets: number;
  totalMarkets: number;
  uniqueTraders: number;
  protocolRevenue: bigint;
  orxPrice: number;
  veOrxSupply: bigint;
}

export interface PricePoint {
  timestamp: number;
  yesPrice: number;
  noPrice: number;
  volume: bigint;
}

export interface LiquidityData {
  yesPool: bigint;
  noPool: bigint;
  totalLiquidity: bigint;
  lpShares: bigint;
  userLpShares: bigint;
}
