import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits, parseUnits } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSDC(amount: bigint): string {
  return Number(formatUnits(amount, 6)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatORX(amount: bigint): string {
  return Number(formatUnits(amount, 18)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function formatShares(shares: bigint): string {
  return Number(formatUnits(shares, 18)).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatProbability(probability: number): string {
  return `${probability}%`;
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeRemaining(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;
  
  if (diff <= 0) return 'Closed';
  
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function calculatePrice(yesPool: bigint, noPool: bigint, side: 0 | 1): number {
  const total = Number(formatUnits(yesPool + noPool, 6));
  if (total === 0) return 0.5;
  
  if (side === 1) {
    // YES price
    return Number(formatUnits(noPool, 6)) / total;
  } else {
    // NO price
    return Number(formatUnits(yesPool, 6)) / total;
  }
}

export function calculateShares(
  amountIn: bigint,
  yesPool: bigint,
  noPool: bigint,
  side: 0 | 1,
  fee: number = 0.003
): bigint {
  const feeAmount = (amountIn * BigInt(Math.floor(fee * 10000))) / 10000n;
  const amountAfterFee = amountIn - feeAmount;
  
  const k = yesPool * noPool;
  
  if (side === 1) {
    // Buying YES
    const newNoPool = noPool + amountAfterFee;
    const newYesPool = k / newNoPool;
    return yesPool - newYesPool;
  } else {
    // Buying NO
    const newYesPool = yesPool + amountAfterFee;
    const newNoPool = k / newYesPool;
    return noPool - newNoPool;
  }
}

export function calculatePnL(
  shares: bigint,
  avgEntryPrice: number,
  currentPrice: number
): bigint {
  const sharesNum = Number(formatUnits(shares, 18));
  const pnl = sharesNum * (currentPrice - avgEntryPrice);
  return parseUnits(pnl.toFixed(6), 6);
}

export function getCategoryName(category: number): string {
  const categories = ['Crypto', 'Sports', 'Politics', 'Entertainment', 'Science', 'Other'];
  return categories[category] || 'Other';
}

export function getCategoryColor(category: number): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-gray-500',
  ];
  return colors[category] || 'bg-gray-500';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-yellow-500',
    active: 'text-green-500',
    locked: 'text-orange-500',
    disputed: 'text-red-500',
    settled: 'text-gray-500',
  };
  return colors[status] || 'text-gray-500';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function openInExplorer(txHash: string, explorerUrl: string): void {
  window.open(`${explorerUrl}/tx/${txHash}`, '_blank');
}
