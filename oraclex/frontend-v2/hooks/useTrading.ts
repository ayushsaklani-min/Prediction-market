'use client';

import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS, CHAIN_CONFIG } from '@/config/contracts';
import { PREDICTION_AMM_ABI, USDC_ABI } from '@/lib/abis';
import { getTargetNetworkName } from '@/lib/network';
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
      if (!publicClient) throw new Error('Public client unavailable');
      // Check if wallet is on correct network
      if (chain?.id !== CHAIN_CONFIG.chainId) {
        toast.error(`Please switch to ${getTargetNetworkName(CHAIN_CONFIG.chainId)} (Chain ID: ${CHAIN_CONFIG.chainId})`);
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

      // Calculate expected shares and apply slippage protection
      const market = await publicClient?.readContract({
        address: CONTRACTS.PredictionAMM,
        abi: PREDICTION_AMM_ABI,
        functionName: 'markets',
        args: [marketId as `0x${string}`],
      }) as any;

      const tradingFee = await publicClient?.readContract({
        address: CONTRACTS.PredictionAMM,
        abi: PREDICTION_AMM_ABI,
        functionName: 'tradingFee',
      }) as bigint;

      const fee = (amount * tradingFee) / 10000n;
      const amountInAfterFee = amount - fee;
      const yesPool = market[1] as bigint;
      const noPool = market[2] as bigint;
      const k = market[3] as bigint;

      let expectedShares = 0n;
      if (side === 1) {
        const newNoPool = noPool + amountInAfterFee;
        const newYesPool = k / newNoPool;
        expectedShares = yesPool - newYesPool;
      } else {
        const newYesPool = yesPool + amountInAfterFee;
        const newNoPool = k / newYesPool;
        expectedShares = noPool - newNoPool;
      }

      const slippageBps = BigInt(Math.floor(slippage * 10000));
      const minShares = (expectedShares * (10000n - slippageBps)) / 10000n;

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
      if (!publicClient) throw new Error('Public client unavailable');
      const shares = parseUnits(sharesAmount, 6);

      const market = await publicClient?.readContract({
        address: CONTRACTS.PredictionAMM,
        abi: PREDICTION_AMM_ABI,
        functionName: 'markets',
        args: [marketId as `0x${string}`],
      }) as any;

      const tradingFee = await publicClient?.readContract({
        address: CONTRACTS.PredictionAMM,
        abi: PREDICTION_AMM_ABI,
        functionName: 'tradingFee',
      }) as bigint;

      const yesPool = market[1] as bigint;
      const noPool = market[2] as bigint;
      const k = market[3] as bigint;

      let expectedAmountOut = 0n;
      if (side === 1) {
        const newYesPool = yesPool + shares;
        const newNoPool = k / newYesPool;
        expectedAmountOut = noPool - newNoPool;
      } else {
        const newNoPool = noPool + shares;
        const newYesPool = k / newNoPool;
        expectedAmountOut = yesPool - newYesPool;
      }

      const fee = (expectedAmountOut * tradingFee) / 10000n;
      const expectedAfterFee = expectedAmountOut - fee;
      const slippageBps = BigInt(Math.floor(slippage * 10000));
      const minAmount = (expectedAfterFee * (10000n - slippageBps)) / 10000n;

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
