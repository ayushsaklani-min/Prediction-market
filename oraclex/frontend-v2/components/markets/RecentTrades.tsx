'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatAddress, formatTimestamp } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import { CHAIN_CONFIG } from '@/config/contracts';

interface RecentTradesProps {
  marketId: string;
}

export function RecentTrades({ marketId }: RecentTradesProps) {
  // TODO: Fetch trades from The Graph subgraph when indexed
  const trades: any[] = [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {trades.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trades yet</p>
          ) : (
            trades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={trade.side === 1 ? 'default' : 'secondary'}>
                    {trade.side === 1 ? 'YES' : 'NO'}
                  </Badge>
                  <div>
                    <div className="font-mono">{formatAddress(trade.trader)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(trade.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${trade.amount}</div>
                  <div className="text-xs text-muted-foreground">
                    @ ${trade.price.toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() =>
                    window.open(`${CHAIN_CONFIG.explorerUrl}/tx/${trade.txHash}`, '_blank')
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
