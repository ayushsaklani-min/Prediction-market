'use client';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { PREDICTION_AMM_ABI, MARKET_FACTORY_ABI } from '@/lib/abis';
import { Market, MarketStatus } from '@/types';

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'http://localhost:4000';

export function useMarkets() {
  const publicClient = usePublicClient();

  return useQuery<Market[]>({
    queryKey: ['markets'],
    queryFn: async (): Promise<Market[]> => {
      if (!publicClient) return [];

      try {
        // Get total number of markets
        const marketCount = await publicClient.readContract({
          address: CONTRACTS.MarketFactory,
          abi: MARKET_FACTORY_ABI,
          functionName: 'getTotalMarkets',
        }) as bigint;

        const count = Number(marketCount);
        if (count === 0) return [];

        // Fetch all market IDs
        const marketIdPromises = [];
        for (let i = 0; i < count; i++) {
          marketIdPromises.push(
            publicClient.readContract({
              address: CONTRACTS.MarketFactory,
              abi: MARKET_FACTORY_ABI,
              functionName: 'allMarketIds',
              args: [BigInt(i)],
            })
          );
        }

        const marketIds = await Promise.all(marketIdPromises);

        // Fetch market details for each ID
        const marketDetailsPromises = marketIds.map(async (marketId) => {
          try {
            const [factoryData, ammData] = await Promise.all([
              publicClient.readContract({
                address: CONTRACTS.MarketFactory,
                abi: MARKET_FACTORY_ABI,
                functionName: 'getMarket',
                args: [marketId as `0x${string}`],
              }),
              publicClient.readContract({
                address: CONTRACTS.PredictionAMM,
                abi: PREDICTION_AMM_ABI,
                functionName: 'markets',
                args: [marketId as `0x${string}`],
              }),
            ]);

            const market: Market = {
              marketId: marketId as string,
              eventId: factoryData[0] as string,
              description: factoryData[1] as string,
              category: Number(factoryData[2]),
              tags: [],
              closeTimestamp: Number(factoryData[3]),
              resolutionTimestamp: Number(factoryData[4]),
              creator: factoryData[5] as string,
              createdAt: 0,
              active: factoryData[6] as boolean,
              yesPool: ammData[1] as bigint,
              noPool: ammData[2] as bigint,
              totalVolume: ammData[4] as bigint,
              totalLiquidity: (ammData[1] as bigint) + (ammData[2] as bigint),
              status: (ammData[7] as boolean) ? MarketStatus.Settled : (factoryData[6] as boolean) ? MarketStatus.Active : MarketStatus.Pending,
              winningSide: (ammData[8] === 0 || ammData[8] === 1) ? ammData[8] as (0 | 1) : undefined,
            };

            return market;
          } catch (error) {
            console.error('Error fetching market details:', error);
            return null;
          }
        });

        const markets = await Promise.all(marketDetailsPromises);
        return markets.filter((m): m is Market => m !== null);
      } catch (error) {
        console.error('Error fetching markets:', error);
        return [];
      }
    },
    enabled: !!publicClient,
    refetchInterval: 10000,
  });
}

export function useMarket(marketId: string) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['market', marketId],
    queryFn: async () => {
      if (!publicClient || !marketId) return null;

      try {
        // Fetch market data from AMM
        const ammData = await publicClient.readContract({
          address: CONTRACTS.PredictionAMM,
          abi: PREDICTION_AMM_ABI,
          functionName: 'markets',
          args: [marketId as `0x${string}`],
        });

        // Fetch market metadata from Factory
        const factoryData = await publicClient.readContract({
          address: CONTRACTS.MarketFactory,
          abi: MARKET_FACTORY_ABI,
          functionName: 'getMarket',
          args: [marketId as `0x${string}`],
        });

        const market: Market = {
          marketId,
          eventId: factoryData[0],
          description: factoryData[1],
          category: factoryData[2],
          tags: [],
          closeTimestamp: Number(factoryData[3]),
          resolutionTimestamp: Number(factoryData[4]),
          creator: factoryData[5],
          createdAt: 0,
          active: factoryData[6],
          yesPool: ammData[1],
          noPool: ammData[2],
          totalVolume: ammData[4],
          totalLiquidity: ammData[1] + ammData[2],
          status: ammData[7] ? MarketStatus.Settled : ammData[6] ? MarketStatus.Active : MarketStatus.Pending,
          winningSide: ammData[8] === 0 || ammData[8] === 1 ? ammData[8] as (0 | 1) : undefined,
        };

        return market;
      } catch (error) {
        console.error('Error fetching market:', error);
        return null;
      }
    },
    enabled: !!marketId && !!publicClient,
    refetchInterval: 5000,
  });
}

export function useMarketPrice(marketId: string, side: 0 | 1) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['market-price', marketId, side],
    queryFn: async () => {
      if (!publicClient || !marketId) return 0;

      try {
        const price = await publicClient.readContract({
          address: CONTRACTS.PredictionAMM,
          abi: PREDICTION_AMM_ABI,
          functionName: 'getPrice',
          args: [marketId as `0x${string}`, side],
        });

        return Number(price) / 10000; // convert from basics points
      } catch (error) {
        console.error('Error fetching price:', error);
        return 0;
      }
    },
    enabled: !!marketId && !!publicClient,
    refetchInterval: 3000,
  });
}

export function useTrendingMarkets() {
  const { data: markets } = useMarkets();

  return useQuery<Market[]>({
    queryKey: ['trending-markets'],
    queryFn: async (): Promise<Market[]> => {
      if (!markets) return [];

      // Sort by volume
      return [...markets]
        .sort((a, b) => Number(b.totalVolume - a.totalVolume))
        .slice(0, 10);
    },
    enabled: !!markets,
  });
}

export function useMarketsByCategory(category: number) {
  const { data: markets } = useMarkets();

  return useQuery({
    queryKey: ['markets-by-category', category],
    queryFn: async () => {
      if (!markets) return [];

      return markets.filter((m) => m.category === category);
    },
    enabled: !!markets,
  });
}
