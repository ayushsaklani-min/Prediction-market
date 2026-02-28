'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Proposal } from '@/types';
import { formatORX, formatAddress, formatTimestamp } from '@/lib/utils';
import { useVoting } from '@/hooks/useVoting';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { useState } from 'react';

interface ProposalCardProps {
  proposal: Proposal;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const { castVoteFor, castVoteAgainst, castVoteAbstain } = useVoting();
  const [isVoting, setIsVoting] = useState(false);

  const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  const forPercentage = totalVotes > 0n ? Number((proposal.forVotes * 10000n) / totalVotes) / 100 : 0;
  const againstPercentage = totalVotes > 0n ? Number((proposal.againstVotes * 10000n) / totalVotes) / 100 : 0;
  const quorumReached = totalVotes >= proposal.quorumRequired;

  const handleVote = async (voteType: 'for' | 'against' | 'abstain') => {
    setIsVoting(true);
    try {
      if (voteType === 'for') {
        await castVoteFor(proposal.proposalId);
      } else if (voteType === 'against') {
        await castVoteAgainst(proposal.proposalId);
      } else {
        await castVoteAbstain(proposal.proposalId);
      }
    } finally {
      setIsVoting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-yes',
      succeeded: 'bg-primary',
      defeated: 'bg-no',
      executed: 'bg-muted',
      pending: 'bg-yellow-500',
    };
    return colors[status] || 'bg-muted';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge className={getStatusColor(proposal.status)}>
                {proposal.status}
              </Badge>
              <Badge variant="outline">{proposal.proposalType}</Badge>
            </div>
            <h3 className="text-xl font-semibold">{proposal.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {proposal.description}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span>By {formatAddress(proposal.proposer)}</span>
          <span>•</span>
          <span>{formatTimestamp(proposal.createdAt)}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Voting Stats */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-yes">
                <ThumbsUp className="h-4 w-4" />
                For
              </span>
              <span className="font-semibold">
                {formatORX(proposal.forVotes)} ({forPercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={forPercentage} className="h-2 bg-muted [&>div]:bg-yes" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-no">
                <ThumbsDown className="h-4 w-4" />
                Against
              </span>
              <span className="font-semibold">
                {formatORX(proposal.againstVotes)} ({againstPercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={againstPercentage} className="h-2 bg-muted [&>div]:bg-no" />
          </div>

          {proposal.abstainVotes > 0n && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Minus className="h-4 w-4" />
                Abstain
              </span>
              <span>{formatORX(proposal.abstainVotes)}</span>
            </div>
          )}
        </div>

        {/* Quorum */}
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Quorum</span>
            <span className={quorumReached ? 'text-yes' : 'text-muted-foreground'}>
              {formatORX(totalVotes)} / {formatORX(proposal.quorumRequired)}
              {quorumReached && ' ✓'}
            </span>
          </div>
        </div>

        {/* Voting Buttons */}
        {proposal.status === 'active' && (
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleVote('for')}
              disabled={isVoting}
            >
              <ThumbsUp className="mr-1 h-4 w-4" />
              For
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleVote('against')}
              disabled={isVoting}
            >
              <ThumbsDown className="mr-1 h-4 w-4" />
              Against
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote('abstain')}
              disabled={isVoting}
            >
              <Minus className="mr-1 h-4 w-4" />
              Abstain
            </Button>
          </div>
        )}

        {proposal.status === 'executed' && proposal.executedAt && (
          <div className="text-sm text-muted-foreground">
            Executed on {formatTimestamp(proposal.executedAt)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
