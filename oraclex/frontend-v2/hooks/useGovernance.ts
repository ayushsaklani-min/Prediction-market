'use client';

import { useQuery } from '@tanstack/react-query';
import { useReadContract, useAccount } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { GOVERNANCE_ABI } from '@/lib/abis';
import { Proposal } from '@/types';

export function useGovernance() {
  const { address } = useAccount();

  // Fetch all proposals (mock data for now - integrate with The Graph in production)
  const { data: proposals, isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      // Mock data - replace with The Graph query
      const mockProposals: Proposal[] = [
        {
          id: '1',
          proposalId: 1n,
          proposer: '0x1234567890123456789012345678901234567890',
          title: 'Reduce Trading Fee to 0.2%',
          description: 'Proposal to reduce the trading fee from 0.3% to 0.2% to increase trading volume.',
          proposalType: 'parameter',
          forVotes: 1000000n * 10n ** 18n,
          againstVotes: 250000n * 10n ** 18n,
          abstainVotes: 50000n * 10n ** 18n,
          quorumRequired: 400000n * 10n ** 18n,
          status: 'active',
          startBlock: 1000000n,
          endBlock: 1050000n,
          createdAt: Date.now() / 1000 - 86400 * 2,
        },
        {
          id: '2',
          proposalId: 2n,
          proposer: '0x9876543210987654321098765432109876543210',
          title: 'Add New Oracle Provider',
          description: 'Proposal to add Chainlink as an additional oracle provider for market settlement.',
          proposalType: 'upgrade',
          forVotes: 800000n * 10n ** 18n,
          againstVotes: 100000n * 10n ** 18n,
          abstainVotes: 25000n * 10n ** 18n,
          quorumRequired: 400000n * 10n ** 18n,
          status: 'succeeded',
          startBlock: 950000n,
          endBlock: 1000000n,
          createdAt: Date.now() / 1000 - 86400 * 7,
          executedAt: Date.now() / 1000 - 86400 * 1,
        },
      ];

      return mockProposals;
    },
    refetchInterval: 10000,
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
