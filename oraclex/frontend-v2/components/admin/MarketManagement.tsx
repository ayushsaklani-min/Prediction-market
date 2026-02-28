'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMarkets } from '@/hooks/useMarkets';
import { formatAddress, formatUSDC, getCategoryName, formatTimeRemaining } from '@/lib/utils';
import { Search, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function MarketManagement() {
  const { data: markets } = useMarkets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMarkets = markets?.filter((market) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      market.description.toLowerCase().includes(query) ||
      market.eventId.toLowerCase().includes(query) ||
      market.marketId.toLowerCase().includes(query)
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-yes" />;
      case 'settled':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'disputed':
        return <XCircle className="h-4 w-4 text-no" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Market Management</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Market</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Closes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMarkets && filteredMarkets.length > 0 ? (
                filteredMarkets.map((market) => (
                  <TableRow key={market.marketId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {market.description.substring(0, 50)}...
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatAddress(market.marketId)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryName(market.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(market.status)}
                        <span className="capitalize">{market.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>${formatUSDC(market.totalVolume)}</TableCell>
                    <TableCell>
                      {formatTimeRemaining(market.closeTimestamp)}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Market Actions</DialogTitle>
                            <DialogDescription>
                              Manage market settlement and disputes
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold">Market ID</h4>
                              <p className="font-mono text-sm">{market.marketId}</p>
                            </div>
                            <div className="space-y-2">
                              <Button className="w-full" variant="outline">
                                Trigger Settlement
                              </Button>
                              <Button className="w-full" variant="outline">
                                View Oracle Data
                              </Button>
                              <Button className="w-full" variant="destructive">
                                Force Settle
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No markets found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
