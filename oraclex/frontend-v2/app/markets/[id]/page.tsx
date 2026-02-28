'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarketDetail } from '@/hooks/useMarketDetail';
import { useBuyShares, useSellShares } from '@/hooks/useTrading';
import { Clock, Users, DollarSign, Activity } from 'lucide-react';
import { PriceChart } from '@/components/markets/PriceChart';
import { RecentTrades } from '@/components/markets/RecentTrades';

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = params.id as string;
  const { isConnected } = useAccount();
  const [buyAmount, setBuyAmount] = useState('10');
  const [sellAmount, setSellAmount] = useState('10');
  const [selectedSide, setSelectedSide] = useState<0 | 1>(1);

  const { buy } = useBuyShares();
  const { sell } = useSellShares();

  const { data: market, isLoading } = useMarketDetail(marketId);

  if (isLoading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-8">
        <div className="text-center">
          <div className="mb-4 text-lg">Loading market...</div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="mb-2 text-2xl font-bold">Market Not Found</h2>
            <p className="text-muted-foreground">
              This market doesn't exist or hasn't been indexed yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryNames = ['Crypto', 'Sports', 'Politics', 'Entertainment', 'Science', 'Other'];
  const categoryName = categoryNames[market.category] || 'Other';
  
  const yesPrice = Number(market.yesPrice) || 0.5;
  const noPrice = Number(market.noPrice) || 0.5;
  const totalLiquidity = Number(market.totalLiquidity); // Already normalized in hook
  const volume = Number(market.totalVolume) / 1e6; // USDC with 6 decimals
  const closeDate = new Date(Number(market.closeTimestamp) * 1000);
  const isClosingSoon = closeDate.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  const handleBuy = async () => {
    if (!isConnected) return;
    try {
      await buy(marketId, selectedSide, buyAmount);
      setBuyAmount('10');
    } catch (error) {
      console.error('Buy error:', error);
    }
  };

  const handleSell = async () => {
    if (!isConnected) return;
    try {
      await sell(marketId, selectedSide, sellAmount);
      setSellAmount('10');
    } catch (error) {
      console.error('Sell error:', error);
    }
  };

  return (
    <div className="container py-8">
      {/* Market Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold">{market.description}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{categoryName}</Badge>
              {market.settled && (
                <Badge variant="default">Settled</Badge>
              )}
              {isClosingSoon && !market.settled && (
                <Badge variant="destructive">
                  <Clock className="mr-1 h-3 w-3" />
                  Closing Soon
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${volume.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Liquidity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalLiquidity.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trades</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{market.trades?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{closeDate.toLocaleDateString()}</div>
              <p className="text-xs text-muted-foreground">{closeDate.toLocaleTimeString()}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Trading Panel */}
        <div className="lg:col-span-2">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Oracle Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Outcome State</span>
                  <Badge variant={market.oracle?.status === 3 ? 'default' : 'outline'}>
                    {market.oracle?.status === 0 && 'None'}
                    {market.oracle?.status === 1 && 'Proposed'}
                    {market.oracle?.status === 2 && 'Challenged'}
                    {market.oracle?.status === 3 && 'Finalized'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Proof Indexed</span>
                  <span>{market.oracle?.proofAvailable ? 'Yes' : 'Pending'}</span>
                </div>
                {market.oracle?.challengeDeadline && market.oracle?.status === 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Challenge Window</span>
                    <span>{Math.ceil((market.oracle.challengeRemaining || 0) / 60)} min remaining</span>
                  </div>
                )}
                {market.oracle?.dispute && (
                  <div className="rounded-md border p-2">
                    <div className="font-medium">Dispute Active</div>
                    <div className="text-muted-foreground">
                      Proposed: {market.oracle.dispute.proposedResult === 1 ? 'YES' : 'NO'} | Resolved: {market.oracle.dispute.resolved ? 'Yes' : 'No'}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <PriceChart marketId={marketId} />
          <RecentTrades marketId={marketId} />
        </div>

        {/* Trading Interface */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Trade</CardTitle>
            </CardHeader>
            <CardContent>
              {market.settled ? (
                <div className="space-y-4">
                  <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4 text-center dark:bg-green-950">
                    <div className="mb-2 text-sm text-muted-foreground">Market Settled</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      Outcome: {market.winningSide === 1 ? 'YES' : 'NO'}
                    </div>
                  </div>
                  {isConnected && (
                    <Button className="w-full" size="lg">
                      Redeem Winnings
                    </Button>
                  )}
                </div>
              ) : (
                <Tabs defaultValue="buy" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy">Buy</TabsTrigger>
                    <TabsTrigger value="sell">Sell</TabsTrigger>
                  </TabsList>

                  <TabsContent value="buy" className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={selectedSide === 1 ? 'default' : 'outline'}
                        onClick={() => setSelectedSide(1)}
                        className="h-20 flex-col"
                      >
                        <div className="text-xs">YES</div>
                        <div className="text-2xl font-bold">{(yesPrice * 100).toFixed(1)}%</div>
                        <div className="text-xs">${yesPrice.toFixed(3)}</div>
                      </Button>
                      <Button
                        variant={selectedSide === 0 ? 'default' : 'outline'}
                        onClick={() => setSelectedSide(0)}
                        className="h-20 flex-col"
                      >
                        <div className="text-xs">NO</div>
                        <div className="text-2xl font-bold">{(noPrice * 100).toFixed(1)}%</div>
                        <div className="text-xs">${noPrice.toFixed(3)}</div>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Amount (USDC)</Label>
                      <Input
                        type="number"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        placeholder="10"
                        min="1"
                      />
                      <div className="flex gap-2">
                        {['10', '50', '100'].map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => setBuyAmount(amount)}
                          >
                            ${amount}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted p-3 text-sm">
                      <div className="flex justify-between">
                        <span>Est. Shares</span>
                        <span className="font-semibold">
                          ~{(Number(buyAmount) / (selectedSide === 1 ? yesPrice : noPrice)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fee (0.3%)</span>
                        <span className="font-semibold">${(Number(buyAmount) * 0.003).toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleBuy}
                      disabled={!isConnected || !buyAmount}
                    >
                      {isConnected ? `Buy ${selectedSide === 1 ? 'YES' : 'NO'}` : 'Connect Wallet'}
                    </Button>
                  </TabsContent>

                  <TabsContent value="sell" className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={selectedSide === 1 ? 'default' : 'outline'}
                        onClick={() => setSelectedSide(1)}
                        className="h-20 flex-col"
                      >
                        <div className="text-xs">YES</div>
                        <div className="text-2xl font-bold">{(yesPrice * 100).toFixed(1)}%</div>
                      </Button>
                      <Button
                        variant={selectedSide === 0 ? 'default' : 'outline'}
                        onClick={() => setSelectedSide(0)}
                        className="h-20 flex-col"
                      >
                        <div className="text-xs">NO</div>
                        <div className="text-2xl font-bold">{(noPrice * 100).toFixed(1)}%</div>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Shares to Sell</Label>
                      <Input
                        type="number"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                        placeholder="10"
                        min="1"
                      />
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleSell}
                      disabled={!isConnected || !sellAmount}
                    >
                      {isConnected ? `Sell ${selectedSide === 1 ? 'YES' : 'NO'}` : 'Connect Wallet'}
                    </Button>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
