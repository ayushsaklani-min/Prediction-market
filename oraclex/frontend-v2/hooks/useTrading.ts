'use client';

import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS } from '@/config/contracts';
import { PREDICTION_AMM_ABI, USDC_ABI } from '@/lib/abis';
import { toast } from 'sonner';

export function useBuyShares() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const buy = async (
    marketId: string,
    side: 0 | 1,
    amountUSDC: string,
    slippage: number = 0.01
  ) => {
    try {
      const amount = parseUnits(amountUSDC, 6);

      // First, approve USDC
      const approveTx = await writeContractAsync({
        address: CONTRACTS.USDC,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACTS.PredictionAMM, amount],
      });

      toast.loading('Approving USDC...', { id: 'approve' });
      await publicClient?.waitForTransactionReceipt({ hash: approveTx });
      toast.success('USDC approved!', { id: 'approve' });

      // Calculate minimum shares with slippage
      const minShares = amount * BigInt(Math.floor((1 - slippage) * 10000)) / 10000n;

      // Buy shares
      const buyTx = await writeContractAsync({
        address: CONTRACTS.PredictionAMM,
        abi: PREDICTION_AMM_ABI,
        functionName: 'buy',
        args: [marketId as `0x${string}`, side, amount, minShares],
      });

      toast.loading('Buying shares...', { id: 'buy' });
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: buyTx });
      toast.success('Shares purchased!', { id: 'buy' });

      return receipt;
    } catch (error: any) {
      console.error('Buy error:', error);
      toast.error(error.message || 'Failed to buy shares');
      throw error;
    }
  };

  return { buy };
}

export function useSellShares() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const sell = async (
    marketId: string,
    side: 0 | 1,
    sharesAmount: string,
    slippage: number = 0.01
  ) => {
    try {
      const shares = parseUnits(sharesAmount, 18);

      // Calculate minimum USDC with slippage
      const minAmount = shares * BigInt(Math.floor((1 - slippage) * 10000)) / 10000n;

      // Sell shares
      const sellTx = await writeContractAsync({
        address: CONTRACTS.PredictionAMM,
        abi: PREDICTION_AMM_ABI,
        functionName: 'sell',
        args: [marketId as `0x${string}`, side, shares, minAmount],
      });

      toast.loading('Selling shares...', { id: 'sell' });
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: sellTx });
      toast.success('Shares sold!', { id: 'sell' });

      return receipt;
    } catch (error: any) {
      console.error('Sell error:', error);
      toast.error(error.message || 'Failed to sell shares');
      throw error;
    }
  };

  return { sell };
}

export function useRedeemWinnings() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const redeem = async (marketId: string, side: 0 | 1, shares: bigint) => {
    try {
      const redeemTx = await writeContractAsync({
        address: CONTRACTS.PredictionAMM,
        abi: PREDICTION_AMM_ABI,
        functionName: 'redeem',
        args: [marketId as `0x${string}`, side, shares],
      });

      toast.loading('Redeeming winnings...', { id: 'redeem' });
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: redeemTx });
      toast.success('Winnings redeemed!', { id: 'redeem' });

      return receipt;
    } catch (error: any) {
      console.error('Redeem error:', error);
      toast.error(error.message || 'Failed to redeem winnings');
      throw error;
    }
  };

  return { redeem };
}
