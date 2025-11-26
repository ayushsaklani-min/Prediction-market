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
  // Mock data - fetch from The Graph in production
  const trades = [
    {
      id: '1',
      trader: '0x1234567890123456789012345678901234567890',
      side: 1,
      type: 'buy',
      amount: '100.00',
      shares: '95.24',
      price: 0.65,
      timestamp: Date.now() / 1000 - 3600,
      txHash: '0xabc123',
    },
    {
      id: '2',
      trader: '0x9876543210987654321098765432109876543210',
      side: 0,
      type: 'sell',
      amount: '50.00',
      shares: '48.78',
      price: 0.35,
      timestamp: Date.now() / 1000 - 7200,
      txHash: '0xdef456',
    },
  ];

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
                  <Badge variant={trade.side === 1 ? 'yes' : 'no'}>
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
