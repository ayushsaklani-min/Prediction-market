'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Market } from '@/types';
import { Brain, TrendingUp, AlertCircle } from 'lucide-react';

interface AIInsightsProps {
  market: Market;
}

export function AIInsights({ market }: AIInsightsProps) {
  if (!market.aiProbability) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle>AI Analysis</CardTitle>
          <Badge variant="outline">
            {market.aiModelVersion || 'GPT-4'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Probability</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-yes" />
            <span className="text-2xl font-bold">{market.aiProbability}%</span>
          </div>
        </div>

        {market.aiConfidence && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Confidence</span>
            <span className="font-semibold">{market.aiConfidence}%</span>
          </div>
        )}

        {market.aiExplanation && (
          <div className="rounded-lg bg-background p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="h-4 w-4" />
              Analysis
            </div>
            <p className="text-sm text-muted-foreground">
              {market.aiExplanation}
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          AI predictions are for informational purposes only. Always do your own research.
        </div>
      </CardContent>
    </Card>
  );
}
