'use client';

import { useWriteContract, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS } from '@/config/contracts';
import { MARKET_FACTORY_ABI, USDC_ABI } from '@/lib/abis';
import { toast } from 'sonner';

interface CreateMarketParams {
  eventId: string;
  description: string;
  category: number;
  tags: string[];
  closeTimestamp: bigint;
  resolutionTimestamp: bigint;
  initialYes: string;
  initialNo: string;
}

export function useCreateMarket() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const createMarket = async (params: CreateMarketParams) => {
    try {
      const initialYes = parseUnits(params.initialYes, 6);
      const initialNo = parseUnits(params.initialNo, 6);
      const totalLiquidity = initialYes + initialNo;
      const creationFee = parseUnits('10', 6); // 10 USDC
      const totalCost = totalLiquidity + creationFee;

      // Step 1: Approve USDC for total cost
      toast.loading('Approving USDC...', { id: 'approve' });
      
      const approveTx = await writeContractAsync({
        address: CONTRACTS.USDC,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACTS.MarketFactory, totalCost],
      });

      await publicClient?.waitForTransactionReceipt({ hash: approveTx });
      toast.success('USDC approved!', { id: 'approve' });

      // Step 2: Create market
      toast.loading('Creating market...', { id: 'create' });
      
      const createTx = await writeContractAsync({
        address: CONTRACTS.MarketFactory,
        abi: MARKET_FACTORY_ABI,
        functionName: 'createMarket',
        args: [
          params.eventId,
          params.description,
          params.category,
          params.tags,
          params.closeTimestamp,
          params.resolutionTimestamp,
          initialYes,
          initialNo,
        ],
      });

      const receipt = await publicClient?.waitForTransactionReceipt({ hash: createTx });
      toast.success('Market created successfully!', { id: 'create' });

      return receipt;
    } catch (error: any) {
      console.error('Create market error:', error);
      toast.dismiss();
      throw error;
    }
  };

  return { createMarket };
}
