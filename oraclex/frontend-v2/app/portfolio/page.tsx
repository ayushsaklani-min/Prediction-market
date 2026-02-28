'use client';

import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';
import Link from 'next/link';
import { useUserPositions } from '@/hooks/usePositions';
import { formatUnits } from 'viem';

export default function PortfolioPage() {
  const { isConnected } = useAccount();

  // Fetch positions directly from blockchain
  const { data: positions = [], isLoading } = useUserPositions();

  if (!isConnected) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Connect your wallet to view your portfolio and trading history.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate portfolio stats
  const activePositions = positions.filter((p) => p.active && p.shares > 0n);
  const totalPositions = positions.length;

  // Estimate portfolio value (assuming 0.5 USDC per share for active markets)
  const totalValue = activePositions.reduce((sum, p) => {
    return sum + Number(formatUnits(p.shares, 6)) * 0.5;
  }, 0);

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">Portfolio</h1>

      {/* Stats Overview */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {activePositions.length} active positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPositions}</div>
            <p className="text-xs text-muted-foreground">
              {activePositions.length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Markets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(positions.map(p => p.marketId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique markets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Positions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading positions...
            </div>
          ) : positions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="mb-4">No positions yet</p>
              <Link href="/markets">
                <Button>Browse Markets</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {positions.map((position, index) => {
                const sharesFormatted = formatUnits(position.shares, 6);
                const estimatedValue = Number(sharesFormatted) * 0.5;
                
                return (
                  <div
                    key={`${position.marketId}-${position.side}-${index}`}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <Link href={`/markets/${position.marketId}`}>
                        <h3 className="font-semibold hover:underline">
                          {position.description}
                        </h3>
                      </Link>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant={position.side === 1 ? 'default' : 'secondary'}>
                          {position.side === 1 ? 'YES' : 'NO'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {Number(sharesFormatted).toFixed(6)} shares
                        </span>
                        {!position.active && (
                          <Badge variant="outline" className="text-xs">
                            Settled
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        ~${estimatedValue.toFixed(4)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Est. value
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
