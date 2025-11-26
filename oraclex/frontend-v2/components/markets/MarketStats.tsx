'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Market } from '@/types';
import { formatUSDC, calculatePrice } from '@/lib/utils';
import { TrendingUp, Activity, DollarSign } from 'lucide-react';

interface MarketStatsProps {
  market: Market;
}

export function MarketStats({ market }: MarketStatsProps) {
  const yesPrice = calculatePrice(market.yesPool, market.noPool, 1);
  const noPrice = calculatePrice(market.yesPool, market.noPool, 0);

  const stats = [
    {
      label: 'YES Price',
      value: `$${yesPrice.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-yes',
    },
    {
      label: 'NO Price',
      value: `$${noPrice.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-no',
    },
    {
      label: 'Total Volume',
      value: `$${formatUSDC(market.totalVolume)}`,
      icon: Activity,
      color: 'text-primary',
    },
    {
      label: 'Liquidity',
      value: `$${formatUSDC(market.totalLiquidity)}`,
      icon: DollarSign,
      color: 'text-primary',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <span className="font-semibold">{stat.value}</span>
            </div>
          );
        })}

        <div className="mt-4 space-y-2 rounded-lg border p-3">
          <div className="text-sm font-semibold">Pool Composition</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">YES Pool</span>
              <span>${formatUSDC(market.yesPool)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NO Pool</span>
              <span>${formatUSDC(market.noPool)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
