'use client';

import { useState } from 'react';
import { useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS, CHAIN_CONFIG } from '@/config/contracts';
import { MARKET_FACTORY_ABI, USDC_ABI } from '@/lib/abis';
import { getTargetNetworkName } from '@/lib/network';
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
  const { chain } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const createMarket = async (params: CreateMarketParams) => {
    try {
      // Check if wallet is on correct network
      if (chain?.id !== CHAIN_CONFIG.chainId) {
        toast.error(`Please switch to ${getTargetNetworkName(CHAIN_CONFIG.chainId)} (Chain ID: ${CHAIN_CONFIG.chainId})`);
        throw new Error('Wrong network');
      }

      const initialYes = parseUnits(params.initialYes, 6);
      const initialNo = parseUnits(params.initialNo, 6);
      const totalLiquidity = initialYes + initialNo;
      const creationFee = parseUnits('10', 6); // 10 USDC
      const totalCost = totalLiquidity + creationFee;

      console.log('USDC Address:', CONTRACTS.USDC);
      console.log('MarketFactory Address:', CONTRACTS.MarketFactory);
      console.log('Total cost:', totalCost.toString());
      console.log('Current Chain ID:', chain?.id);

      // Step 1: Approve USDC for total cost
      setIsApproving(true);
      toast.loading('Approving USDC...', { id: 'approve' });

      const approveTx = await writeContractAsync({
        address: CONTRACTS.USDC,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACTS.MarketFactory, totalCost],
      });

      await publicClient?.waitForTransactionReceipt({ hash: approveTx });
      toast.success('USDC approved!', { id: 'approve' });
      setIsApproving(false);

      // Step 2: Create market
      setIsCreating(true);
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
      setIsCreating(false);

      return receipt;
    } catch (error: any) {
      console.error('Create market error:', error);
      setIsApproving(false);
      setIsCreating(false);
      toast.dismiss();
      throw error;
    }
  };

  return { createMarket, isApproving, isCreating };
}
