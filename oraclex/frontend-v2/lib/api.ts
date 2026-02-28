const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || '';

export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

export async function querySubgraph<T>(query: string, variables?: Record<string, any>): Promise<T> {
  if (!SUBGRAPH_URL) {
    throw new Error('NEXT_PUBLIC_SUBGRAPH_URL is not configured.');
  }

  const response = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });

  const json: GraphQLResponse<T> = await response.json();
  
  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}

export const queries = {
  GET_MARKETS: `
    query GetMarkets($first: Int!, $skip: Int!, $orderBy: String, $orderDirection: String, $where: Market_filter) {
      markets(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection, where: $where) {
        id
        marketId
        eventId
        description
        category
        tags
        closeTimestamp
        resolutionTimestamp
        creator { id address totalVolume totalTrades }
        createdAt
        active
        settled
        winningSide
        yesPool
        noPool
        totalVolume
        totalFees
        totalLiquidity
        yesPrice
        noPrice
        updatedAt
      }
    }
  `,
  
  GET_MARKET: `
    query GetMarket($id: ID!) {
      market(id: $id) {
        id
        marketId
        eventId
        description
        category
        tags
        closeTimestamp
        resolutionTimestamp
        creator { id address }
        createdAt
        active
        settled
        winningSide
        yesPool
        noPool
        totalVolume
        totalFees
        totalLiquidity
        yesPrice
        noPrice
        trades(first: 100, orderBy: timestamp, orderDirection: desc) {
          id
          trader { id address }
          side
          isBuy
          amountIn
          sharesOut
          fee
          price
          timestamp
          txHash
        }
        outcome {
          result
          oracle
          timestamp
          status
          dispute {
            disputer
            proposedResult
            resolved
            valid
          }
        }
      }
    }
  `,
  
  GET_USER_POSITIONS: `
    query GetUserPositions($user: String!) {
      positions(where: { user: $user }) {
        id
        market {
          id
          marketId
          description
          active
          settled
          winningSide
          yesPool
          noPool
        }
        side
        shares
        averagePrice
        realizedPnL
        unrealizedPnL
        updatedAt
      }
    }
  `,
  
  GET_USER_TRADES: `
    query GetUserTrades($user: String!, $first: Int!) {
      trades(where: { trader: $user }, first: $first, orderBy: timestamp, orderDirection: desc) {
        id
        market {
          id
          marketId
          description
        }
        side
        isBuy
        amountIn
        sharesOut
        fee
        price
        timestamp
        txHash
      }
    }
  `,
  
  GET_GLOBAL_STATS: `
    query GetGlobalStats {
      globalStats(id: "global") {
        totalMarkets
        totalVolume
        totalTrades
        totalUsers
        totalFees
        updatedAt
      }
    }
  `,
  
  GET_TRENDING_MARKETS: `
    query GetTrendingMarkets($first: Int!) {
      markets(first: $first, orderBy: totalVolume, orderDirection: desc, where: { active: true }) {
        id
        marketId
        eventId
        description
        category
        totalVolume
        totalLiquidity
        yesPrice
        noPrice
        createdAt
      }
    }
  `,
  
  GET_MARKETS_BY_CATEGORY: `
    query GetMarketsByCategory($category: Int!, $first: Int!) {
      markets(first: $first, where: { category: $category, active: true }, orderBy: createdAt, orderDirection: desc) {
        id
        marketId
        eventId
        description
        category
        totalVolume
        totalLiquidity
        yesPrice
        noPrice
        closeTimestamp
      }
    }
  `
};
