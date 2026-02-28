'use client';

import { usePublicClient } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { CONTRACTS } from '@/config/contracts';
import { MARKET_FACTORY_ABI, PREDICTION_AMM_ABI } from '@/lib/abis';

function isRpcAuthError(error: unknown): boolean {
  const message = String((error as any)?.message || '').toLowerCase();
  return (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('api key disabled') ||
    message.includes('tenant disabled') ||
    message.includes('unauthorized')
  );
}

export function useAnalytics() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      if (!publicClient) return null;

      try {
        // Get total number of markets
        const totalMarkets = await publicClient.readContract({
          address: CONTRACTS.MarketFactory,
          abi: MARKET_FACTORY_ABI,
          functionName: 'getTotalMarkets',
        }) as bigint;

        if (totalMarkets === 0n) {
          return {
            totalMarkets: 0,
            totalVolume: 0,
            totalLiquidity: 0,
            activeMarkets: 0,
            markets: [],
          };
        }

        // Fetch all markets
        const markets = [];
        let totalVolume = 0n;
        let totalLiquidity = 0n;
        let activeCount = 0;

        for (let i = 0; i < Number(totalMarkets); i++) {
          const marketId = await publicClient.readContract({
            address: CONTRACTS.MarketFactory,
            abi: MARKET_FACTORY_ABI,
            functionName: 'allMarketIds',
            args: [BigInt(i)],
          }) as `0x${string}`;

          const marketData = await publicClient.readContract({
            address: CONTRACTS.MarketFactory,
            abi: MARKET_FACTORY_ABI,
            functionName: 'getMarket',
            args: [marketId],
          }) as any;

          const ammData = await publicClient.readContract({
            address: CONTRACTS.PredictionAMM,
            abi: PREDICTION_AMM_ABI,
            functionName: 'markets',
            args: [marketId],
          }) as any;

          // ammData: [marketId, yesPool, noPool, k, totalVolume, totalFees, active, settled, winningSide]
          // Liquidity is sum of reserves (USDC with 6 decimals)
          const liquidityShares = ammData[1] + ammData[2];

          const market = {
            id: marketId,
            description: marketData[1],
            category: Number(marketData[2]),
            active: marketData[6],
            settled: ammData[7],
            totalVolume: ammData[4], // USDC with 6 decimals
            totalLiquidity: liquidityShares, // Shares with 18 decimals
            createdAt: Date.now(), // We don't have creation timestamp on-chain
          };

          markets.push(market);
          totalVolume += ammData[4]; // USDC volume
          totalLiquidity += liquidityShares; // Total shares
          if (marketData[6]) activeCount++;
        }

        return {
          totalMarkets: Number(totalMarkets),
          totalVolume: Number(totalVolume),
          totalLiquidity: Number(totalLiquidity),
          activeMarkets: activeCount,
          markets,
        };
      } catch (error) {
        if (isRpcAuthError(error)) {
          console.warn('Analytics RPC endpoint rejected request (auth/rate limit).');
        } else {
          console.error('Error fetching analytics:', error);
        }
        return null;
      }
    },
    enabled: !!publicClient,
    refetchInterval: 30000,
    retry: (failureCount, error) => {
      if (isRpcAuthError(error)) return false;
      return failureCount < 1;
    },
  });
}
