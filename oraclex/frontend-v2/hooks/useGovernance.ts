'use client';

import { useQuery } from '@tanstack/react-query';
import { useReadContract, useAccount, usePublicClient } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { GOVERNANCE_ABI } from '@/lib/abis';
import { Proposal } from '@/types';

export function useGovernance() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  // Fetch all proposals from blockchain by reading ProposalCreated events
  const { data: proposals, isLoading } = useQuery({
    queryKey: ['proposals', CONTRACTS.Governance],
    queryFn: async (): Promise<Proposal[]> => {
      if (!publicClient || !CONTRACTS.Governance) return [];

      try {
        console.log('Fetching proposals from:', CONTRACTS.Governance);
        
        // Get ProposalCreated events from the Governance contract
        // Use getContractEvents for better compatibility
        const logs = await publicClient.getContractEvents({
          address: CONTRACTS.Governance as `0x${string}`,
          abi: GOVERNANCE_ABI,
          eventName: 'ProposalCreated',
          fromBlock: BigInt(30288000), // Start from recent block to avoid timeout
          toBlock: 'latest',
        });

        console.log('Found', logs.length, 'proposal events');

        // Parse proposals from events
        const proposalsData = await Promise.all(
          logs.map(async (log: any) => {
            const proposalId = log.args.proposalId;
            const description = log.args.description || '';
            
            // Parse title from description (first line after #)
            const titleMatch = description.match(/^#\s*(.+)$/m);
            const title = titleMatch ? titleMatch[1].trim() : 'Untitled Proposal';

            // Get proposal state
            const state = await publicClient.readContract({
              address: CONTRACTS.Governance as `0x${string}`,
              abi: GOVERNANCE_ABI,
              functionName: 'state',
              args: [proposalId],
            });

            // Map state number to status
            const stateMap: { [key: number]: string } = {
              0: 'pending',
              1: 'active',
              2: 'canceled',
              3: 'defeated',
              4: 'succeeded',
              5: 'queued',
              6: 'expired',
              7: 'executed',
            };

            // Get vote counts
            let forVotes = 0n;
            let againstVotes = 0n;
            let abstainVotes = 0n;
            
            try {
              const votes = await publicClient.readContract({
                address: CONTRACTS.Governance as `0x${string}`,
                abi: GOVERNANCE_ABI,
                functionName: 'proposalVotes',
                args: [proposalId],
              }) as [bigint, bigint, bigint];
              
              againstVotes = votes[0];
              forVotes = votes[1];
              abstainVotes = votes[2];
            } catch (e) {
              // proposalVotes might not exist, use default 0
            }

            return {
              id: proposalId.toString(),
              proposalId: proposalId,
              title,
              description,
              proposer: log.args.proposer as `0x${string}`,
              proposalType: 'parameter' as const,
              status: stateMap[Number(state)] as any || 'pending',
              startBlock: BigInt(log.args.voteStart),
              endBlock: BigInt(log.args.voteEnd),
              forVotes,
              againstVotes,
              abstainVotes,
              quorumRequired: 0n,
              createdAt: Date.now(),
            };
          })
        );

        return proposalsData;
      } catch (error) {
        console.error('Error fetching proposals:', error);
        return [];
      }
    },
    enabled: !!publicClient && !!CONTRACTS.Governance,
    refetchInterval: 30000,
  });

  // Get proposal state
  const useProposalState = (proposalId: bigint) => {
    return useReadContract({
      address: CONTRACTS.Governance,
      abi: GOVERNANCE_ABI,
      functionName: 'state',
      args: [proposalId],
    });
  };

  // Get active proposals
  const activeProposals = proposals?.filter((p) => p.status === 'active') || [];

  // Get past proposals
  const pastProposals = proposals?.filter((p) => p.status !== 'active') || [];

  return {
    proposals,
    activeProposals,
    pastProposals,
    isLoading,
    useProposalState,
  };
}
