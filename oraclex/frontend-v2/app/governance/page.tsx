'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StakingPanel } from '@/components/governance/StakingPanel';
import { ProposalCard } from '@/components/governance/ProposalCard';
import { useGovernance } from '@/hooks/useGovernance';
import { useStaking } from '@/hooks/useStaking';
import { useAccount } from 'wagmi';
import { formatORX } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Vote, Lock, TrendingUp, Users, Plus } from 'lucide-react';

export default function GovernancePage() {
  const { address, isConnected } = useAccount();
  const { proposals, activeProposals, pastProposals, isLoading } = useGovernance();
  const { lockedBalance, veOrxBalance } = useStaking();

  if (!isConnected) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Vote className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
            <p className="text-center text-sm text-muted-foreground">
              Connect your wallet to participate in governance
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Governance</h1>
          <p className="text-muted-foreground">
            Stake ORX and vote on protocol proposals
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Proposal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your veORX</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {veOrxBalance ? formatORX(veOrxBalance) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Voting Power</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locked ORX</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lockedBalance ? formatORX(lockedBalance[0]) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {lockedBalance && lockedBalance[1] > 0n
                ? `Until ${new Date(Number(lockedBalance[1]) * 1000).toLocaleDateString()}`
                : 'No lock'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProposals.length}</div>
            <p className="text-xs text-muted-foreground">Vote now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposals?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Staking */}
        <div className="lg:col-span-1">
          <StakingPanel />
        </div>

        {/* Right: Proposals */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList>
              <TabsTrigger value="active">
                Active ({activeProposals.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastProposals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
                </>
              ) : activeProposals.length > 0 ? (
                activeProposals.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center gap-4 py-12">
                    <Vote className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center">
                      <h3 className="font-semibold">No Active Proposals</h3>
                      <p className="text-sm text-muted-foreground">
                        Check back later or create a new proposal
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
                </>
              ) : pastProposals.length > 0 ? (
                pastProposals.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center gap-4 py-12">
                    <Vote className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center">
                      <h3 className="font-semibold">No Past Proposals</h3>
                      <p className="text-sm text-muted-foreground">
                        Past proposals will appear here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
