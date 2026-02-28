'use client';

import { usePublicClient } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { CONTRACTS } from '@/config/contracts';
import { MARKET_FACTORY_ABI, ORACLE_ADAPTER_ABI, PREDICTION_AMM_ABI } from '@/lib/abis';
import { querySubgraph, queries } from '@/lib/api';

export function useMarketDetail(marketId: string) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['market-detail', marketId],
    queryFn: async () => {
      if (!publicClient || !marketId) return null;

      try {
        let subgraphMarket: any = null;
        try {
          const subgraphData = await querySubgraph<any>(queries.GET_MARKET, { id: marketId.toLowerCase() });
          subgraphMarket = subgraphData?.market || null;
        } catch (_) {
          // Subgraph is optional in local/dev mode.
        }

        // Get market data from MarketFactory
        const marketData = await publicClient.readContract({
          address: CONTRACTS.MarketFactory,
          abi: MARKET_FACTORY_ABI,
          functionName: 'getMarket',
          args: [marketId as `0x${string}`],
        }) as any;

        // Get pool state from PredictionAMM
        const ammData = await publicClient.readContract({
          address: CONTRACTS.PredictionAMM,
          abi: PREDICTION_AMM_ABI,
          functionName: 'markets',
          args: [marketId as `0x${string}`],
        }) as any;

        let oracleOutcome: any = null;
        try {
          oracleOutcome = await publicClient.readContract({
            address: CONTRACTS.OracleAdapter,
            abi: ORACLE_ADAPTER_ABI,
            functionName: 'getOutcome',
            args: [marketId as `0x${string}`],
          });
        } catch (_) {
          oracleOutcome = null;
        }

        // Calculate prices
        // ammData: [marketId, yesPool, noPool, k, totalVolume, totalFees, active, settled, winningSide]
        const yesReserve = Number(ammData[1]) / 1e6;
        const noReserve = Number(ammData[2]) / 1e6;
        const totalReserve = yesReserve + noReserve;
        
        const yesPrice = totalReserve > 0 ? noReserve / totalReserve : 0.5;
        const noPrice = totalReserve > 0 ? yesReserve / totalReserve : 0.5;
        const oracleStatus = oracleOutcome ? Number(oracleOutcome[3]) : 0;
        const oracleTimestamp = oracleOutcome ? Number(oracleOutcome[2]) : 0;
        const challengeDeadline = oracleStatus === 1 ? oracleTimestamp + 24 * 60 * 60 : null;
        const challengeRemaining = challengeDeadline ? Math.max(0, challengeDeadline - Math.floor(Date.now() / 1000)) : 0;

        return {
          id: marketId,
          eventId: marketData[0],
          description: marketData[1],
          category: Number(marketData[2]),
          creator: marketData[5],
          closeTimestamp: marketData[3],
          resolutionTimestamp: marketData[4],
          active: marketData[6],
          settled: ammData[7],
          winningSide: Number(ammData[8]),
          yesPrice,
          noPrice,
          yesReserve: ammData[1],
          noReserve: ammData[2],
          totalLiquidity: (Number(ammData[1]) + Number(ammData[2])) / 1e6, // USDC has 6 decimals
          totalVolume: ammData[4], // USDC with 6 decimals
          trades: subgraphMarket?.trades || [],
          oracle: {
            result: oracleOutcome ? Number(oracleOutcome[0]) : null,
            reporter: oracleOutcome ? oracleOutcome[1] : null,
            timestamp: oracleTimestamp || null,
            status: oracleStatus,
            challengeDeadline,
            challengeRemaining,
            finalized: oracleStatus === 3 || Boolean(ammData[7]),
            proofAvailable: Boolean(subgraphMarket?.outcome?.proof),
            dispute: subgraphMarket?.outcome?.dispute || null,
          },
        };
      } catch (error) {
        console.error('Error fetching market detail:', error);
        return null;
      }
    },
    enabled: !!publicClient && !!marketId,
    refetchInterval: 5000,
  });
}
