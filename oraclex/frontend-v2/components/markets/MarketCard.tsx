'use client';

import Link from 'next/link';
import { Market } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  formatUSDC, 
  formatTimeRemaining, 
  getCategoryName, 
  getCategoryColor,
  calculatePrice,
  truncateText
} from '@/lib/utils';
import { TrendingUp, Clock, Users } from 'lucide-react';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const yesPrice = calculatePrice(market.yesPool, market.noPool, 1);
  const noPrice = calculatePrice(market.yesPool, market.noPool, 0);
  const timeRemaining = formatTimeRemaining(market.closeTimestamp);

  return (
    <Link href={`/markets/${market.marketId}`}>
      <Card className="card-hover h-full transition-all">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Badge className={getCategoryColor(market.category)}>
              {getCategoryName(market.category)}
            </Badge>
            {market.aiProbability && (
              <Badge variant="outline" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                AI: {market.aiProbability}%
              </Badge>
            )}
          </div>
          
          <h3 className="line-clamp-2 text-lg font-semibold leading-tight">
            {truncateText(market.description, 100)}
          </h3>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Price Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">YES</span>
              <span className="font-semibold text-yes">
                ${yesPrice.toFixed(2)}
              </span>
            </div>
            <Progress value={yesPrice * 100} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">NO</span>
              <span className="font-semibold text-no">
                ${noPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Volume
              </div>
              <div className="font-semibold">
                ${formatUSDC(market.totalVolume)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                Liquidity
              </div>
              <div className="font-semibold">
                ${formatUSDC(market.totalLiquidity)}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {timeRemaining}
          </div>
          <Badge variant={market.status === 'active' ? 'default' : 'secondary'}>
            {market.status}
          </Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}
