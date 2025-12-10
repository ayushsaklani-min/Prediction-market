'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { querySubgraph, queries } from '@/lib/api';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const { data: globalStats } = useQuery({
    queryKey: ['global-stats'],
    queryFn: () => querySubgraph<any>(queries.GET_GLOBAL_STATS, {}),
    refetchInterval: 30000,
  });

  const { data: markets } = useQuery({
    queryKey: ['all-markets-analytics'],
    queryFn: () => querySubgraph<any>(queries.GET_MARKETS, { 
      first: 1000, 
      skip: 0,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    }),
    refetchInterval: 30000,
  });

  const stats = (globalStats as any)?.globalStats;
  const marketData = (markets as any)?.markets || [];

  // Calculate category distribution
  const categoryData = [
    { name: 'Crypto', value: marketData.filter((m: any) => m.category === 0).length },
    { name: 'Sports', value: marketData.filter((m: any) => m.category === 1).length },
    { name: 'Politics', value: marketData.filter((m: any) => m.category === 2).length },
    { name: 'Entertainment', value: marketData.filter((m: any) => m.category === 3).length },
    { name: 'Science', value: marketData.filter((m: any) => m.category === 4).length },
    { name: 'Other', value: marketData.filter((m: any) => m.category === 5).length },
  ].filter(c => c.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Volume over time
  const volumeData = marketData
    .sort((a: any, b: any) => parseInt(a.createdAt) - parseInt(b.createdAt))
    .map((m: any, i: number) => ({
      date: new Date(parseInt(m.createdAt) * 1000).toLocaleDateString(),
      volume: Number(m.totalVolume) / 1e6,
      cumulative: marketData.slice(0, i + 1).reduce((sum: number, market: any) => sum + Number(market.totalVolume) / 1e6, 0)
    }));

  // Top markets by volume
  const topMarkets = [...marketData]
    .sort((a: any, b: any) => Number(b.totalVolume) - Number(a.totalVolume))
    .slice(0, 10)
    .map((m: any) => ({
      name: m.description.substring(0, 30) + '...',
      volume: Number(m.totalVolume) / 1e6
    }));

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">Analytics Dashboard</h1>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Markets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMarkets || 0}</div>
            <p className="text-xs text-muted-foreground">
              {marketData.filter((m: any) => m.active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((Number(stats?.totalVolume || 0) / 1e6).toFixed(2))}
            </div>
            <p className="text-xs text-muted-foreground">
              USDC traded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTrades || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Unique traders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Volume Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="cumulative" stroke="#8884d8" fill="#8884d8" name="Cumulative Volume (USDC)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Markets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Markets by Volume */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Markets by Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topMarkets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="volume" fill="#8884d8" name="Volume (USDC)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
