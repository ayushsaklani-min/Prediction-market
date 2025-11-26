'use client';

import { useAccount } from 'wagmi';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketManagement } from '@/components/admin/MarketManagement';
import { TreasuryOverview } from '@/components/admin/TreasuryOverview';
import { SystemControls } from '@/components/admin/SystemControls';
import { Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { isAdmin } = useAdmin();

  if (!isConnected) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Shield className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
            <p className="text-center text-sm text-muted-foreground">
              Connect your wallet to access the admin panel
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-center text-sm text-muted-foreground">
              You don't have admin permissions to access this page
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage markets, treasury, and system settings
            </p>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <AlertTitle>Admin Access</AlertTitle>
        <AlertDescription>
          You have elevated permissions. Actions performed here affect all users.
          Use with caution.
        </AlertDescription>
      </Alert>

      {/* Admin Tabs */}
      <Tabs defaultValue="markets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="treasury">Treasury</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="oracle">Oracle</TabsTrigger>
        </TabsList>

        <TabsContent value="markets" className="space-y-6">
          <MarketManagement />
        </TabsContent>

        <TabsContent value="treasury" className="space-y-6">
          <TreasuryOverview />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemControls />
        </TabsContent>

        <TabsContent value="oracle" className="space-y-6">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <h3 className="mb-2 font-semibold">Oracle Management</h3>
                <p className="text-sm text-muted-foreground">
                  View Chainlink Functions logs, AI predictions, and settlement data
                </p>
                <div className="mt-6 space-y-2">
                  <div className="rounded-lg border p-4">
                    <div className="mb-2 text-sm font-semibold">Last AI Prediction</div>
                    <div className="text-xs text-muted-foreground">
                      Market: 0x1234...5678
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Probability: 65% (Confidence: 85%)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Model: GPT-4-turbo-preview
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="mb-2 text-sm font-semibold">Last Settlement</div>
                    <div className="text-xs text-muted-foreground">
                      Market: 0x9876...4321
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Outcome: YES (Confidence: 92%)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Status: Finalized
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
