'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface PriceChartProps {
  marketId: string;
}

export function PriceChart({ marketId }: PriceChartProps) {
  // Fetch price history from subgraph (when indexed)
  const { data: priceHistory = [] } = useQuery({
    queryKey: ['price-history', marketId],
    queryFn: async () => {
      // TODO: Fetch from The Graph subgraph when indexed
      // For now, return empty array - price history will show when trades are indexed
      return [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="price" className="space-y-4">
          <TabsList>
            <TabsTrigger value="price">Price</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
          </TabsList>

          <TabsContent value="price" className="h-80">
            {priceHistory.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Price history will appear once trades are indexed
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  domain={[0, 1]}
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="yesPrice"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="YES"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="noPrice"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="NO"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="volume" className="h-80">
            {priceHistory.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Volume history will appear once trades are indexed
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `$${value.toFixed(0)}`}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Volume"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
