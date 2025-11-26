'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { MARKET_POSITIONS_ABI, PREDICTION_AMM_ABI, ORX_TOKEN_ABI, VEORX_ABI } from '@/lib/abis';
import { Position, UserStats } from '@/types';
import { formatUnits } from 'viem';

export function useUserPositions() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['user-positions', address],
    queryFn: async () => {
      if (!publicClient || !address) return [];

      // In production, fetch from The Graph
      // For now, we'll need to track positions manually or use events
      const positions: Position[] = [];
      
      return positions;
    },
    enabled: !!address && !!publicClient,
    refetchInterval: 10000,
  });
}

export function useUserStats() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  // Get ORX balance
  const { data: orxBalance } = useReadContract({
    address: CONTRACTS.ORXToken,
    abi: ORX_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Get veORX balance
  const { data: veOrxBalance } = useReadContract({
    address: CONTRACTS.veORX,
    abi: VEORX_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Get claimable rewards
  const { data: claimableRewards } = useReadContract({
    address: CONTRACTS.FeeDistributor,
    abi: [
      {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getTotalClaimableRewards',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getTotalClaimableRewards',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  return useQuery({
    queryKey: ['user-stats', address, orxBalance, veOrxBalance, claimableRewards],
    queryFn: async () => {
      if (!address) return null;

      const stats: UserStats = {
        totalVolume: BigInt(0),
        totalTrades: 0,
        winRate: 0,
        realizedPnl: BigInt(0),
        unrealizedPnl: BigInt(0),
        activePositions: 0,
        orxBalance: orxBalance || BigInt(0),
        veOrxBalance: veOrxBalance || BigInt(0),
        claimableRewards: claimableRewards || BigInt(0),
      };

      return stats;
    },
    enabled: !!address,
    refetchInterval: 10000,
  });
}

export function usePositionValue(marketId: string, side: 0 | 1, shares: bigint) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['position-value', marketId, side, shares.toString()],
    queryFn: async () => {
      if (!publicClient || shares === BigInt(0)) return BigInt(0);

      try {
        // Get current price
        const price = await publicClient.readContract({
          address: CONTRACTS.PredictionAMM,
          abi: PREDICTION_AMM_ABI,
          functionName: 'getPrice',
          args: [marketId as `0x${string}`, side],
        });

        // Calculate value: shares * price / 10000
        const value = (shares * price) / BigInt(10000);
        return value;
      } catch (error) {
        console.error('Error calculating position value:', error);
        return BigInt(0);
      }
    },
    enabled: !!publicClient && shares > BigInt(0),
    refetchInterval: 5000,
  });
}

export function useUserBalance(tokenId: number) {
  const { address } = useAccount();

  const { data: balance } = useReadContract({
    address: CONTRACTS.MarketPositions,
    abi: MARKET_POSITIONS_ABI,
    functionName: 'balanceOf',
    args: address ? [address, BigInt(tokenId)] : undefined,
    query: {
      enabled: !!address,
    }
  });

  return balance || BigInt(0);
}
