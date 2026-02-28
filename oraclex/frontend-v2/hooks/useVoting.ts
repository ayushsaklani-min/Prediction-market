'use client';

import { useWriteContract, useAccount } from 'wagmi';
import { CONTRACTS, isConfiguredAddress } from '@/config/contracts';
import { GOVERNANCE_ABI } from '@/lib/abis';
import { toast } from 'sonner';
import { usePublicClient } from 'wagmi';

export function useVoting() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const castVote = async (proposalId: bigint, support: 0 | 1 | 2) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!isConfiguredAddress(CONTRACTS.Governance)) {
      toast.error('Governance contract is not configured');
      return;
    }

    try {
      const supportText = support === 1 ? 'For' : support === 0 ? 'Against' : 'Abstain';
      toast.loading(`Casting vote: ${supportText}...`, { id: 'vote' });

      const voteTx = await writeContractAsync({
        address: CONTRACTS.Governance,
        abi: GOVERNANCE_ABI,
        functionName: 'castVote',
        args: [proposalId, support],
      });

      await publicClient?.waitForTransactionReceipt({ hash: voteTx });
      toast.success(`Vote cast: ${supportText}!`, { id: 'vote' });

      return voteTx;
    } catch (error: any) {
      console.error('Vote error:', error);
      toast.error(error.message || 'Failed to cast vote');
      throw error;
    }
  };

  const castVoteFor = (proposalId: bigint) => castVote(proposalId, 1);
  const castVoteAgainst = (proposalId: bigint) => castVote(proposalId, 0);
  const castVoteAbstain = (proposalId: bigint) => castVote(proposalId, 2);

  return {
    castVote,
    castVoteFor,
    castVoteAgainst,
    castVoteAbstain,
  };
}
