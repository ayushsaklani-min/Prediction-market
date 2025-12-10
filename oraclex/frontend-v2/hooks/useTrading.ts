'use client';

import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS, CHAIN_CONFIG } from '@/config/contracts';
import { PREDICTION_AMM_ABI, USDC_ABI } from '@/lib/abis';
import { toast } from 'sonner';

export function useBuyShares() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { chain } = useAccount();

  const buy = async (
    marketId: string,
    side: 0 | 1,
    amountUSDC: string,
    slippage: number = 0.01
  ) => {
    try {
      // Check if wallet is on correct network
      if (chain?.id !== CHAIN_CONFIG.chainId) {
        toast.error(`Please switch to Polygon Amoy Testnet (Chain ID: ${CHAIN_CONFIG.chainId})`);
        throw new Error('Wrong network');
      }

      const amount = parseUnits(amountUSDC, 6);

      // Debug: Log contract addresses
      console.log('USDC Address:', CONTRACTS.USDC);
      console.log('PredictionAMM Address:', CONTRACTS.PredictionAMM);
      console.log('Amount to approve:', amount.toString());
      console.log('Current Chain ID:', chain?.id);

      // First, approve USDC
      toast.loading('Approving USDC...', { id: 'approve' });
      
      const approveTx = await writeContractAsync({
        address: CONTRACTS.USDC,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACTS.PredictionAMM, amount],
      });

      await publicClient?.waitForTransactionReceipt({ hash: approveTx });
      toast.success('USDC approved!', { id: 'approve' });

      // Set minShares to 0 to disable slippage protection
      // TODO: Calculate expected shares using AMM formula (k = x * y)
      const minShares = 0n;

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
