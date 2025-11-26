'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { ORX_TOKEN_ABI } from '@/lib/abis';
import { formatORX, formatUSDC } from '@/lib/utils';
import { DollarSign, TrendingUp, Wallet, Download } from 'lucide-react';

export function TreasuryOverview() {
  // Read treasury ORX balance
  const { data: orxBalance } = useReadContract({
    address: CONTRACTS.ORXToken,
    abi: ORX_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [CONTRACTS.Treasury],
  });

  // Mock data for other balances
  const usdcBalance = 50000n * 10n ** 6n; // 50,000 USDC
  const totalFees = 12500n * 10n ** 6n; // 12,500 USDC
  const lpRewards = 8750n * 10n ** 6n; // 8,750 USDC

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Treasury Overview</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              ORX Balance
            </div>
            <div className="text-2xl font-bold">
              {orxBalance ? formatORX(orxBalance) : '0'}
            </div>
          </div>

          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              USDC Balance
            </div>
            <div className="text-2xl font-bold">${formatUSDC(usdcBalance)}</div>
          </div>

          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Fees Collected
            </div>
            <div className="text-2xl font-bold">${formatUSDC(totalFees)}</div>
          </div>

          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              LP Rewards Pool
            </div>
            <div className="text-2xl font-bold">${formatUSDC(lpRewards)}</div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <h4 className="font-semibold">Treasury Actions</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" className="w-full">
              Distribute Fees
            </Button>
            <Button variant="outline" className="w-full">
              Withdraw Funds (Multi-sig)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
