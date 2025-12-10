'use client';

import { useAccount, usePublicClient } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { CONTRACTS } from '@/config/contracts';
import { MARKET_FACTORY_ABI, MARKET_POSITIONS_ABI } from '@/lib/abis';
import { keccak256, encodePacked, hexToBigInt } from 'viem';

interface Position {
  marketId: string;
  description: string;
  side: 0 | 1;
  shares: bigint;
  active: boolean;
}

export function useUserPositions() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['user-positions', address],
    queryFn: async (): Promise<Position[]> => {
      if (!address || !publicClient) return [];

      try {
        // Get total number of markets
        const totalMarkets = await publicClient.readContract({
          address: CONTRACTS.MarketFactory,
          abi: MARKET_FACTORY_ABI,
          functionName: 'getTotalMarkets',
        }) as bigint;

        if (totalMarkets === 0n) return [];

        const positions: Position[] = [];

        // Check each market for user positions
        for (let i = 0; i < Number(totalMarkets); i++) {
          // Get market ID
          const marketId = await publicClient.readContract({
            address: CONTRACTS.MarketFactory,
            abi: MARKET_FACTORY_ABI,
            functionName: 'allMarketIds',
            args: [BigInt(i)],
          }) as `0x${string}`;

          // Get market details
          const market = await publicClient.readContract({
            address: CONTRACTS.MarketFactory,
            abi: MARKET_FACTORY_ABI,
            functionName: 'getMarket',
            args: [marketId],
          }) as any;

          // Calculate token IDs for YES and NO
          const yesTokenId = hexToBigInt(keccak256(encodePacked(['bytes32', 'uint8'], [marketId, 1])));
          const noTokenId = hexToBigInt(keccak256(encodePacked(['bytes32', 'uint8'], [marketId, 0])));

          // Check YES balance
          const yesBalance = await publicClient.readContract({
            address: CONTRACTS.MarketPositions,
            abi: MARKET_POSITIONS_ABI,
            functionName: 'balanceOf',
            args: [address, yesTokenId],
          }) as bigint;

          // Check NO balance
          const noBalance = await publicClient.readContract({
            address: CONTRACTS.MarketPositions,
            abi: MARKET_POSITIONS_ABI,
            functionName: 'balanceOf',
            args: [address, noTokenId],
          }) as bigint;

          // Add positions if user has shares
          if (yesBalance > 0n) {
            positions.push({
              marketId,
              description: market[1], // description is second element
              side: 1,
              shares: yesBalance,
              active: market[6], // active is 7th element
            });
          }

          if (noBalance > 0n) {
            positions.push({
              marketId,
              description: market[1],
              side: 0,
              shares: noBalance,
              active: market[6],
            });
          }
        }

        return positions;
      } catch (error) {
        console.error('Error fetching positions:', error);
        return [];
      }
    },
    enabled: !!address && !!publicClient,
    refetchInterval: 10000,
  });
}
