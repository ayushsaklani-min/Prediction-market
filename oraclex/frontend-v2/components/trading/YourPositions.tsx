'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { MARKET_POSITIONS_ABI } from '@/lib/abis';
import { formatShares } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface YourPositionsProps {
  marketId: string;
}

export function YourPositions({ marketId }: YourPositionsProps) {
  const { address } = useAccount();

  // Read YES position
  const { data: yesShares } = useReadContract({
    address: CONTRACTS.MarketPositions,
    abi: MARKET_POSITIONS_ABI,
    functionName: 'balanceOf',
    args: address ? [address, BigInt(marketId) * 2n + 1n] : undefined,
  });

  // Read NO position
  const { data: noShares } = useReadContract({
    address: CONTRACTS.MarketPositions,
    abi: MARKET_POSITIONS_ABI,
    functionName: 'balanceOf',
    args: address ? [address, BigInt(marketId) * 2n] : undefined,
  });

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect wallet to view positions
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasPositions = (yesShares && yesShares > 0n) || (noShares && noShares > 0n);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Positions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasPositions ? (
          <p className="text-sm text-muted-foreground">No positions yet</p>
        ) : (
          <>
            {yesShares && yesShares > 0n && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">YES</Badge>
                    <span className="font-semibold">
                      {formatShares(yesShares)} shares
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Avg. price: $0.65
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-semibold text-yes">
                    <TrendingUp className="h-4 w-4" />
                    +$12.34
                  </div>
                  <p className="text-xs text-muted-foreground">+15.2%</p>
                </div>
              </div>
            )}

            {noShares && noShares > 0n && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">NO</Badge>
                    <span className="font-semibold">
                      {formatShares(noShares)} shares
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Avg. price: $0.35
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-semibold text-no">
                    <TrendingDown className="h-4 w-4" />
                    -$5.67
                  </div>
                  <p className="text-xs text-muted-foreground">-8.1%</p>
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full">
              Sell Position
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
