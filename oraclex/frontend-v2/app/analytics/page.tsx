'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Protocol metrics and statistics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">
              No trading activity yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Markets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Create your first market
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Traders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No traders yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocol TVL</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">
              No liquidity yet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Message */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Analytics Coming Soon</h3>
            <p className="mb-4 max-w-md text-sm text-muted-foreground">
              Detailed analytics will be available once markets are created and trading begins.
              Create your first market to start seeing data!
            </p>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Future analytics will include:</p>
              <ul className="list-inside list-disc space-y-1 text-left">
                <li>Trading volume charts</li>
                <li>Market performance metrics</li>
                <li>User activity statistics</li>
                <li>Protocol revenue tracking</li>
                <li>Top traders leaderboard</li>
                <li>Market category breakdown</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
