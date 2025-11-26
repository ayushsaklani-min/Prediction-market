'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Market } from '@/types';
import { useBuyShares, useSellShares } from '@/hooks/useTrading';
import { useAccount, useBalance } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { parseUnits, formatUnits } from 'viem';
import { calculateShares, calculatePrice, formatUSDC } from '@/lib/utils';
import { ArrowDownUp, Info } from 'lucide-react';
import { toast } from 'sonner';

interface TradingInterfaceProps {
  marketId: string;
  market: Market;
}

export function TradingInterface({ marketId, market }: TradingInterfaceProps) {
  const [side, setSide] = useState<0 | 1>(1); // 1 = YES, 0 = NO
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(1); // 1%
  const [isLoading, setIsLoading] = useState(false);

  const { address } = useAccount();
  const { data: usdcBalance } = useBalance({
    address,
    token: CONTRACTS.USDC,
  });

  const { buy } = useBuyShares();
  const { sell } = useSellShares();

  const amountBigInt = amount ? parseUnits(amount, 6) : 0n;
  const estimatedShares = calculateShares(
    amountBigInt,
    market.yesPool,
    market.noPool,
    side
  );
  const currentPrice = calculatePrice(market.yesPool, market.noPool, side);
  const fee = Number(amount) * 0.003; // 0.3% fee

  const handleBuy = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter an amount');
      return;
    }

    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    try {
      await buy(marketId, side, amount, slippage / 100);
      setAmount('');
      toast.success('Shares purchased successfully!');
    } catch (error) {
      console.error('Buy error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    if (usdcBalance) {
      setAmount(formatUnits(usdcBalance.value, 6));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Side Selection */}
        <Tabs
          value={side === 1 ? 'yes' : 'no'}
          onValueChange={(v) => setSide(v === 'yes' ? 1 : 0)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="yes" className="data-[state=active]:bg-yes">
              YES ${currentPrice.toFixed(2)}
            </TabsTrigger>
            <TabsTrigger value="no" className="data-[state=active]:bg-no">
              NO ${(1 - currentPrice).toFixed(2)}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Amount (USDC)</Label>
            {usdcBalance && (
              <button
                onClick={handleMaxClick}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Balance: {formatUSDC(usdcBalance.value)}
              </button>
            )}
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-16"
            />
            <button
              onClick={handleMaxClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Slippage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Slippage Tolerance</Label>
            <span className="text-sm font-semibold">{slippage}%</span>
          </div>
          <Slider
            value={[slippage]}
            onValueChange={(v) => setSlippage(v[0])}
            min={0.1}
            max={5}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.1%</span>
            <span>5%</span>
          </div>
        </div>

        {/* Summary */}
        {amount && Number(amount) > 0 && (
          <div className="space-y-2 rounded-lg border bg-muted/50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">You pay</span>
              <span className="font-semibold">{amount} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">You receive</span>
              <span className="font-semibold">
                {formatUnits(estimatedShares, 18)} shares
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg. price</span>
              <span className="font-semibold">${currentPrice.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee (0.3%)</span>
              <span className="font-semibold">${fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Total cost</span>
              <span className="font-semibold">{amount} USDC</span>
            </div>
          </div>
        )}

        {/* Buy Button */}
        <Button
          className="w-full"
          size="lg"
          variant={side === 1 ? 'yes' : 'no'}
          onClick={handleBuy}
          disabled={!amount || Number(amount) <= 0 || isLoading || !address}
        >
          {!address
            ? 'Connect Wallet'
            : isLoading
            ? 'Processing...'
            : `Buy ${side === 1 ? 'YES' : 'NO'}`}
        </Button>

        {/* Info */}
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0" />
          <p>
            Prices are determined by the AMM. Your trade may move the price.
            Slippage protection ensures you don't pay more than expected.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
