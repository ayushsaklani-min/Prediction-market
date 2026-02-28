'use client';

import { Market } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getCategoryName,
  getCategoryColor,
  formatTimeRemaining,
  formatAddress,
  getStatusColor,
} from '@/lib/utils';
import {
  Clock,
  TrendingUp,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { CHAIN_CONFIG } from '@/config/contracts';

interface MarketHeaderProps {
  market: Market;
}

export function MarketHeader({ market }: MarketHeaderProps) {
  const timeRemaining = formatTimeRemaining(market.closeTimestamp);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleViewExplorer = () => {
    window.open(
      `${CHAIN_CONFIG.explorerUrl}/address/${market.ammAddress}`,
      '_blank'
    );
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getCategoryColor(market.category)}>
              {getCategoryName(market.category)}
            </Badge>
            <Badge variant="outline" className={getStatusColor(market.status)}>
              {market.status}
            </Badge>
            {market.aiProbability && (
              <Badge variant="outline" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                AI: {market.aiProbability}%
                {market.aiConfidence && (
                  <span className="text-xs opacity-70">
                    ({market.aiConfidence}% confidence)
                  </span>
                )}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {market.description}
          </h1>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleViewExplorer}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Event ID</div>
          <div className="font-mono text-sm">{market.eventId}</div>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Creator</div>
          <div className="font-mono text-sm">
            {formatAddress(market.creator)}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            Closes in
          </div>
          <div className="font-semibold">{timeRemaining}</div>
        </div>
      </div>

      {market.status === 'settled' && market.winningSide !== undefined && (
        <div className="mt-4 rounded-lg bg-secondary p-4">
          <div className="text-sm font-semibold">
            Market Settled:{' '}
            <span className={market.winningSide === 1 ? 'text-yes' : 'text-no'}>
              {market.winningSide === 1 ? 'YES' : 'NO'} won
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
