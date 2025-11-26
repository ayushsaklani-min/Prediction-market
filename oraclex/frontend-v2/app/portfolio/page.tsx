'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { TrendingUp, TrendingDown, Wallet, Award } from 'lucide-react';

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Wallet className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
            <p className="text-center text-sm text-muted-foreground">
              Connect your wallet to view your portfolio and trading history
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">Your Portfolio</h1>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,234.56</div>
            <p className="text-xs text-muted-foreground">Across all positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realized PnL</CardTitle>
            <TrendingUp className="h-4 w-4 text-yes" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yes">+$234.56</div>
            <p className="text-xs text-muted-foreground">From closed positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized PnL</CardTitle>
            <TrendingDown className="h-4 w-4 text-no" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-no">-$45.23</div>
            <p className="text-xs text-muted-foreground">From open positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground">12 wins / 18 trades</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Positions</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No active positions. Start trading to see your positions here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No trade history yet.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>Claimable Rewards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-semibold">LP Rewards</div>
                  <p className="text-sm text-muted-foreground">From providing liquidity</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">$12.34</div>
                  <Button size="sm" className="mt-2">Claim</Button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-semibold">veORX Rewards</div>
                  <p className="text-sm text-muted-foreground">From staking ORX</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">$45.67</div>
                  <Button size="sm" className="mt-2">Claim</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
