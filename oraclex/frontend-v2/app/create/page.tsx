'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { useCreateMarket } from '@/hooks/useCreateMarket';

export default function CreateMarketPage() {
  const { address, isConnected } = useAccount();
  const { createMarket, isApproving, isCreating } = useCreateMarket();
  
  const [formData, setFormData] = useState({
    eventId: '',
    description: '',
    category: 0,
    closeDate: '',
    resolutionDate: '',
    initialYes: '100',
    initialNo: '100',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    // Validation
    if (!formData.description) {
      toast.error('Please enter a description');
      return;
    }

    if (!formData.closeDate || !formData.resolutionDate) {
      toast.error('Please select close and resolution dates');
      return;
    }

    const closeTimestamp = Math.floor(new Date(formData.closeDate).getTime() / 1000);
    const resolutionTimestamp = Math.floor(new Date(formData.resolutionDate).getTime() / 1000);
    
    if (closeTimestamp <= Date.now() / 1000) {
      toast.error('Close date must be in the future');
      return;
    }
    
    if (resolutionTimestamp <= closeTimestamp) {
      toast.error('Resolution date must be after close date');
      return;
    }
    
    try {
      await createMarket({
        eventId: formData.eventId || `market-${Date.now()}`,
        description: formData.description,
        category: formData.category,
        tags: [],
        closeTimestamp: BigInt(closeTimestamp),
        resolutionTimestamp: BigInt(resolutionTimestamp),
        initialYes: formData.initialYes,
        initialNo: formData.initialNo
      });
      
      toast.success('Market created successfully!');
      
      // Reset form
      setFormData({
        eventId: '',
        description: '',
        category: 0,
        closeDate: '',
        resolutionDate: '',
        initialYes: '100',
        initialNo: '100',
      });
    } catch (error: any) {
      console.error('Market creation error:', error);
      toast.error(error.message || 'Failed to create market');
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-8 text-3xl font-bold">Create Market</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Market Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">Event Description *</Label>
              <Textarea
                id="description"
                placeholder="Will ETH reach $5000 by Dec 31, 2024?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Be specific and clear. This will be the main question traders see.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="closeDate">Close Date *</Label>
                <Input
                  id="closeDate"
                  type="datetime-local"
                  value={formData.closeDate}
                  onChange={(e) =>
                    setFormData({ ...formData, closeDate: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  When trading stops
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolutionDate">Resolution Date *</Label>
                <Input
                  id="resolutionDate"
                  type="datetime-local"
                  value={formData.resolutionDate}
                  onChange={(e) =>
                    setFormData({ ...formData, resolutionDate: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  When outcome is determined
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="initialYes">Initial YES Liquidity (USDC)</Label>
                <Input
                  id="initialYes"
                  type="number"
                  min="10"
                  value={formData.initialYes}
                  onChange={(e) =>
                    setFormData({ ...formData, initialYes: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialNo">Initial NO Liquidity (USDC)</Label>
                <Input
                  id="initialNo"
                  type="number"
                  min="10"
                  value={formData.initialNo}
                  onChange={(e) =>
                    setFormData({ ...formData, initialNo: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="mb-3 font-semibold">Estimated Costs</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creation Fee</span>
                  <span className="font-medium">10 USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Initial Liquidity</span>
                  <span className="font-medium">
                    {Number(formData.initialYes) + Number(formData.initialNo)} USDC
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span>
                    {10 + Number(formData.initialYes) + Number(formData.initialNo)} USDC
                  </span>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg" 
              disabled={!isConnected || isApproving || isCreating}
            >
              {!isConnected 
                ? 'Connect Wallet' 
                : isApproving 
                ? 'Approving USDC...' 
                : isCreating 
                ? 'Creating Market...' 
                : 'Create Market'}
            </Button>

            {!isConnected && (
              <p className="text-center text-sm text-muted-foreground">
                Connect your wallet to create a market
              </p>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
