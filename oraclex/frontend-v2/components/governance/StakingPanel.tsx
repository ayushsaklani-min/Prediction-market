'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStaking } from '@/hooks/useStaking';
import { formatORX, formatTimestamp } from '@/lib/utils';
import { Lock, Plus, Clock } from 'lucide-react';
import { formatUnits } from 'viem';

const LOCK_DURATIONS = [
  { label: '1 Week', value: 7 * 24 * 60 * 60 },
  { label: '1 Month', value: 30 * 24 * 60 * 60 },
  { label: '3 Months', value: 90 * 24 * 60 * 60 },
  { label: '6 Months', value: 180 * 24 * 60 * 60 },
  { label: '1 Year', value: 365 * 24 * 60 * 60 },
  { label: '4 Years', value: 4 * 365 * 24 * 60 * 60 },
];

export function StakingPanel() {
  const {
    lockedBalance,
    veOrxBalance,
    orxBalance,
    createLock,
    increaseLockAmount,
    increaseLockDuration,
    withdraw,
  } = useStaking();

  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(LOCK_DURATIONS[4].value);
  const [increaseAmount, setIncreaseAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hasLock = lockedBalance && lockedBalance[0] > 0n;
  const lockExpired = lockedBalance && Number(lockedBalance[1]) < Date.now() / 1000;

  const handleCreateLock = async () => {
    if (!stakeAmount || Number(stakeAmount) <= 0) return;
    setIsLoading(true);
    try {
      await createLock(stakeAmount, selectedDuration);
      setStakeAmount('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncreaseLock = async () => {
    if (!increaseAmount || Number(increaseAmount) <= 0) return;
    setIsLoading(true);
    try {
      await increaseLockAmount(increaseAmount);
      setIncreaseAmount('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendLock = async () => {
    setIsLoading(true);
    try {
      await increaseLockDuration(selectedDuration);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setIsLoading(true);
    try {
      await withdraw();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Stake ORX
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Lock Info */}
        {hasLock && (
          <div className="mb-6 space-y-3 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Locked ORX</span>
              <span className="font-semibold">
                {formatORX(lockedBalance[0])}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Voting Power (veORX)</span>
              <span className="font-semibold text-primary">
                {veOrxBalance ? formatORX(veOrxBalance) : '0'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Lock Expires</span>
              <span className={lockExpired ? 'text-yes' : 'text-muted-foreground'}>
                {formatTimestamp(Number(lockedBalance[1]))}
              </span>
            </div>
            {lockExpired && (
              <Button
                onClick={handleWithdraw}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                Withdraw ORX
              </Button>
            )}
          </div>
        )}

        {/* Staking Interface */}
        <Tabs defaultValue={hasLock ? 'increase' : 'create'}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create" disabled={hasLock}>
              Create Lock
            </TabsTrigger>
            <TabsTrigger value="increase" disabled={!hasLock}>
              Increase
            </TabsTrigger>
            <TabsTrigger value="extend" disabled={!hasLock}>
              Extend
            </TabsTrigger>
          </TabsList>

          {/* Create Lock */}
          <TabsContent value="create" className="space-y-4">
            <div className="space-y-2">
              <Label>Amount to Lock</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
                {orxBalance && (
                  <button
                    onClick={() => setStakeAmount(formatUnits(orxBalance, 18))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary"
                  >
                    MAX
                  </button>
                )}
              </div>
              {orxBalance && (
                <p className="text-xs text-muted-foreground">
                  Balance: {formatORX(orxBalance)} ORX
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Lock Duration</Label>
              <div className="grid grid-cols-3 gap-2">
                {LOCK_DURATIONS.map((duration) => (
                  <Button
                    key={duration.value}
                    variant={selectedDuration === duration.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDuration(duration.value)}
                  >
                    {duration.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You will receive</span>
                <span className="font-semibold">
                  ~{stakeAmount || '0'} veORX
                </span>
              </div>
            </div>

            <Button
              onClick={handleCreateLock}
              disabled={!stakeAmount || Number(stakeAmount) <= 0 || isLoading}
              className="w-full"
            >
              Create Lock
            </Button>
          </TabsContent>

          {/* Increase Lock */}
          <TabsContent value="increase" className="space-y-4">
            <div className="space-y-2">
              <Label>Additional Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={increaseAmount}
                onChange={(e) => setIncreaseAmount(e.target.value)}
              />
            </div>

            <Button
              onClick={handleIncreaseLock}
              disabled={!increaseAmount || Number(increaseAmount) <= 0 || isLoading}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Increase Lock Amount
            </Button>
          </TabsContent>

          {/* Extend Lock */}
          <TabsContent value="extend" className="space-y-4">
            <div className="space-y-2">
              <Label>New Lock Duration</Label>
              <div className="grid grid-cols-3 gap-2">
                {LOCK_DURATIONS.map((duration) => (
                  <Button
                    key={duration.value}
                    variant={selectedDuration === duration.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDuration(duration.value)}
                  >
                    {duration.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleExtendLock}
              disabled={isLoading}
              className="w-full"
            >
              <Clock className="mr-2 h-4 w-4" />
              Extend Lock Duration
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
