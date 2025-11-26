'use client';

import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS } from '@/config/contracts';
import { VEORX_ABI, ORX_TOKEN_ABI } from '@/lib/abis';
import { toast } from 'sonner';
import { usePublicClient } from 'wagmi';

export function useStaking() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // Read user's locked balance
  const { data: lockedBalance, refetch: refetchLocked } = useReadContract({
    address: CONTRACTS.veORX,
    abi: VEORX_ABI,
    functionName: 'locked',
    args: address ? [address] : undefined,
  });

  // Read user's veORX balance (voting power)
  const { data: veOrxBalance, refetch: refetchVeOrx } = useReadContract({
    address: CONTRACTS.veORX,
    abi: VEORX_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read user's ORX balance
  const { data: orxBalance } = useReadContract({
    address: CONTRACTS.ORXToken,
    abi: ORX_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const createLock = async (amount: string, duration: number) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const amountBigInt = parseUnits(amount, 18);

      // First approve ORX
      toast.loading('Approving ORX...', { id: 'approve' });
      const approveTx = await writeContractAsync({
        address: CONTRACTS.ORXToken,
        abi: ORX_TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACTS.veORX, amountBigInt],
      });

      await publicClient?.waitForTransactionReceipt({ hash: approveTx });
      toast.success('ORX approved!', { id: 'approve' });

      // Create lock
      toast.loading('Creating lock...', { id: 'lock' });
      const lockTx = await writeContractAsync({
        address: CONTRACTS.veORX,
        abi: VEORX_ABI,
        functionName: 'createLock',
        args: [amountBigInt, BigInt(duration)],
      });

      await publicClient?.waitForTransactionReceipt({ hash: lockTx });
      toast.success('Lock created successfully!', { id: 'lock' });

      // Refetch balances
      refetchLocked();
      refetchVeOrx();

      return lockTx;
    } catch (error: any) {
      console.error('Create lock error:', error);
      toast.error(error.message || 'Failed to create lock');
      throw error;
    }
  };

  const increaseLockAmount = async (additionalAmount: string) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const amountBigInt = parseUnits(additionalAmount, 18);

      // Approve
      toast.loading('Approving ORX...', { id: 'approve' });
      const approveTx = await writeContractAsync({
        address: CONTRACTS.ORXToken,
        abi: ORX_TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACTS.veORX, amountBigInt],
      });

      await publicClient?.waitForTransactionReceipt({ hash: approveTx });
      toast.success('ORX approved!', { id: 'approve' });

      // Increase amount
      toast.loading('Increasing lock amount...', { id: 'increase' });
      const increaseTx = await writeContractAsync({
        address: CONTRACTS.veORX,
        abi: VEORX_ABI,
        functionName: 'increaseLockAmount',
        args: [amountBigInt],
      });

      await publicClient?.waitForTransactionReceipt({ hash: increaseTx });
      toast.success('Lock amount increased!', { id: 'increase' });

      refetchLocked();
      refetchVeOrx();

      return increaseTx;
    } catch (error: any) {
      console.error('Increase lock error:', error);
      toast.error(error.message || 'Failed to increase lock');
      throw error;
    }
  };

  const increaseLockDuration = async (newDuration: number) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      toast.loading('Extending lock duration...', { id: 'extend' });
      const extendTx = await writeContractAsync({
        address: CONTRACTS.veORX,
        abi: VEORX_ABI,
        functionName: 'increaseLockDuration',
        args: [BigInt(newDuration)],
      });

      await publicClient?.waitForTransactionReceipt({ hash: extendTx });
      toast.success('Lock duration extended!', { id: 'extend' });

      refetchLocked();
      refetchVeOrx();

      return extendTx;
    } catch (error: any) {
      console.error('Extend lock error:', error);
      toast.error(error.message || 'Failed to extend lock');
      throw error;
    }
  };

  const withdraw = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      toast.loading('Withdrawing ORX...', { id: 'withdraw' });
      const withdrawTx = await writeContractAsync({
        address: CONTRACTS.veORX,
        abi: VEORX_ABI,
        functionName: 'withdraw',
      });

      await publicClient?.waitForTransactionReceipt({ hash: withdrawTx });
      toast.success('ORX withdrawn!', { id: 'withdraw' });

      refetchLocked();
      refetchVeOrx();

      return withdrawTx;
    } catch (error: any) {
      console.error('Withdraw error:', error);
      toast.error(error.message || 'Failed to withdraw');
      throw error;
    }
  };

  return {
    lockedBalance,
    veOrxBalance,
    orxBalance,
    createLock,
    increaseLockAmount,
    increaseLockDuration,
    withdraw,
  };
}
