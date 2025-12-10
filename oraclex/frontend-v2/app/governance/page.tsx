'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StakingPanel } from '@/components/governance/StakingPanel';
import { ProposalCard } from '@/components/governance/ProposalCard';
import { useGovernance } from '@/hooks/useGovernance';
import { useStaking } from '@/hooks/useStaking';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { formatORX } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Vote, Lock, TrendingUp, Users, Plus } from 'lucide-react';
import { CONTRACTS } from '@/config/contracts';
import { GOVERNANCE_ABI } from '@/lib/abis';
import { toast } from 'sonner';

export default function GovernancePage() {
  const { address, isConnected } = useAccount();
  const { proposals, activeProposals, pastProposals, isLoading } = useGovernance();
  const { lockedBalance, veOrxBalance } = useStaking();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [targetAddress, setTargetAddress] = useState('');
  const [calldata, setCalldata] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Check if Governance contract is deployed
  const isGovernanceDeployed = CONTRACTS.Governance && CONTRACTS.Governance !== '0x...' && CONTRACTS.Governance.length === 42;

  const handleCreateProposal = async () => {
    if (!address || !proposalTitle || !proposalDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      toast.loading('Creating proposal...', { id: 'create-proposal' });

      // OpenZeppelin Governor requires at least one action
      // Use dummy action for signal votes, or real action if provided
      const targets: `0x${string}`[] = targetAddress ? [targetAddress as `0x${string}`] : ['0x0000000000000000000000000000000000000000'];
      const values: bigint[] = targetAddress ? [0n] : [0n];
      const calldatas: `0x${string}`[] = calldata ? [calldata as `0x${string}`] : ['0x'];
      const description = `# ${proposalTitle}\n\n${proposalDescription}`;

      // Note: User needs 100 ORX locked as veORX to create proposals
      const tx = await writeContractAsync({
        address: CONTRACTS.Governance,
        abi: GOVERNANCE_ABI,
        functionName: 'propose',
        args: [targets, values, calldatas, description],
      });

      await publicClient?.waitForTransactionReceipt({ hash: tx });
      
      toast.success('Proposal created successfully!', { id: 'create-proposal' });
      setIsCreateDialogOpen(false);
      setProposalTitle('');
      setProposalDescription('');
      setTargetAddress('');
      setCalldata('');
    } catch (error: any) {
      console.error('Create proposal error:', error);
      toast.error(error.message || 'Failed to create proposal', { id: 'create-proposal' });
    } finally {
      setIsCreating(false);
    }
  };

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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!isGovernanceDeployed} title={!isGovernanceDeployed ? 'Governance contract not deployed yet' : ''}>
              <Plus className="mr-2 h-4 w-4" />
              Create Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Governance Proposal</DialogTitle>
              <DialogDescription>
                Submit a proposal for the DAO to vote on. You need sufficient veORX to create proposals.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Reduce Trading Fee to 0.2%"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Explain your proposal in detail..."
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="target">Target Contract (optional)</Label>
                <Input
                  id="target"
                  placeholder="0x..."
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Leave empty for signal votes
                </p>
              </div>
              <div>
                <Label htmlFor="calldata">Calldata (optional)</Label>
                <Input
                  id="calldata"
                  placeholder="0x..."
                  value={calldata}
                  onChange={(e) => setCalldata(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Function call data if executing on-chain action
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateProposal} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Proposal'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
                        {isGovernanceDeployed 
                          ? 'Check back later or create a new proposal'
                          : 'Governance contract not deployed yet'}
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
