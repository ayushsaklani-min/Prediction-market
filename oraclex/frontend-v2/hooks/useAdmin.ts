'use client';

import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { 
  PREDICTION_AMM_ABI, 
  MARKET_FACTORY_ABI,
  ORACLE_ADAPTER_ABI,
  TREASURY_ABI,
  ORX_TOKEN_ABI
} from '@/lib/abis';
import { toast } from 'sonner';
import { parseUnits } from 'viem';

export function useAdmin() {
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();

  // Check if user has admin role
  const { data: isAdmin } = useReadContract({
    address: CONTRACTS.PredictionAMM,
    abi: PREDICTION_AMM_ABI,
    functionName: 'hasRole',
    args: [
      '0x0000000000000000000000000000000000000000000000000000000000000000', // DEFAULT_ADMIN_ROLE
      address as `0x${string}`
    ],
    query: {
      enabled: !!address,
    }
  });

  // Pause/Unpause AMM
  const pauseAMM = async () => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.PredictionAMM,
        abi: PREDICTION_AMM_ABI,
        functionName: 'pause',
      });
      
      toast.success('AMM paused successfully');
      return hash;
    } catch (error: any) {
      console.error('Error pausing AMM:', error);
      toast.error(error?.message || 'Failed to pause AMM');
      throw error;
    }
  };

  const unpauseAMM = async () => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.PredictionAMM,
        abi: PREDICTION_AMM_ABI,
        functionName: 'unpause',
      });
      
      toast.success('AMM unpaused successfully');
      return hash;
    } catch (error: any) {
      console.error('Error unpausing AMM:', error);
      toast.error(error?.message || 'Failed to unpause AMM');
      throw error;
    }
  };

  // Update trading fee
  const updateTradingFee = async (newFee: number) => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.PredictionAMM,
        abi: PREDICTION_AMM_ABI,
        functionName: 'setTradingFee',
        args: [BigInt(newFee)],
      });
      
      toast.success('Trading fee updated successfully');
      return hash;
    } catch (error: any) {
      console.error('Error updating fee:', error);
      toast.error(error?.message || 'Failed to update trading fee');
      throw error;
    }
  };

  // Update market creation fee
  const updateCreationFee = async (newFee: string) => {
    try {
      const feeInUsdc = parseUnits(newFee, 6); // USDC has 6 decimals
      const hash = await writeContractAsync({
        address: CONTRACTS.MarketFactory,
        abi: MARKET_FACTORY_ABI,
        functionName: 'setMarketCreationFee',
        args: [feeInUsdc],
      });
      
      toast.success('Creation fee updated successfully');
      return hash;
    } catch (error: any) {
      console.error('Error updating creation fee:', error);
      toast.error(error?.message || 'Failed to update creation fee');
      throw error;
    }
  };

  // Update minimum liquidity
  const updateMinLiquidity = async (newMin: string) => {
    try {
      const minInUsdc = parseUnits(newMin, 6);
      const hash = await writeContractAsync({
        address: CONTRACTS.MarketFactory,
        abi: MARKET_FACTORY_ABI,
        functionName: 'setMinInitialLiquidity',
        args: [minInUsdc],
      });
      
      toast.success('Minimum liquidity updated successfully');
      return hash;
    } catch (error: any) {
      console.error('Error updating min liquidity:', error);
      toast.error(error?.message || 'Failed to update minimum liquidity');
      throw error;
    }
  };

  // Settle market manually (admin override)
  const settleMarket = async (marketId: string, winningSide: 0 | 1) => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.PredictionAMM,
        abi: PREDICTION_AMM_ABI,
        functionName: 'settleMarket',
        args: [marketId as `0x${string}`, winningSide],
      });
      
      toast.success('Market settled successfully');
      return hash;
    } catch (error: any) {
      console.error('Error settling market:', error);
      toast.error(error?.message || 'Failed to settle market');
      throw error;
    }
  };

  // Propose outcome (oracle role)
  const proposeOutcome = async (marketId: string, result: 0 | 1, proof: string = '0x') => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.OracleAdapter,
        abi: ORACLE_ADAPTER_ABI,
        functionName: 'proposeOutcome',
        args: [marketId as `0x${string}`, result, proof as `0x${string}`],
      });
      
      toast.success('Outcome proposed successfully');
      return hash;
    } catch (error: any) {
      console.error('Error proposing outcome:', error);
      toast.error(error?.message || 'Failed to propose outcome');
      throw error;
    }
  };

  // Finalize outcome (after challenge period)
  const finalizeOutcome = async (marketId: string) => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.OracleAdapter,
        abi: ORACLE_ADAPTER_ABI,
        functionName: 'finalizeOutcome',
        args: [marketId as `0x${string}`],
      });
      
      toast.success('Outcome finalized successfully');
      return hash;
    } catch (error: any) {
      console.error('Error finalizing outcome:', error);
      toast.error(error?.message || 'Failed to finalize outcome');
      throw error;
    }
  };

  // Distribute treasury fees
  const distributeFees = async (token: string) => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.Treasury,
        abi: TREASURY_ABI,
        functionName: 'distributeFees',
        args: [token as `0x${string}`],
      });
      
      toast.success('Fees distributed successfully');
      return hash;
    } catch (error: any) {
      console.error('Error distributing fees:', error);
      toast.error(error?.message || 'Failed to distribute fees');
      throw error;
    }
  };

  // Mint ORX tokens (for testing)
  const mintORX = async (to: string, amount: string) => {
    try {
      const amountInWei = parseUnits(amount, 18);
      const hash = await writeContractAsync({
        address: CONTRACTS.ORXToken,
        abi: ORX_TOKEN_ABI,
        functionName: 'mint',
        args: [to as `0x${string}`, amountInWei],
      });
      
      toast.success('ORX minted successfully');
      return hash;
    } catch (error: any) {
      console.error('Error minting ORX:', error);
      toast.error(error?.message || 'Failed to mint ORX');
      throw error;
    }
  };

  return {
    isAdmin: !!isAdmin,
    pauseAMM,
    unpauseAMM,
    updateTradingFee,
    updateCreationFee,
    updateMinLiquidity,
    settleMarket,
    proposeOutcome,
    finalizeOutcome,
    distributeFees,
    mintORX,
  };
}
