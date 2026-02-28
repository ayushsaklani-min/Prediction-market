'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { fallback, http } from 'wagmi';
import { polygon } from 'wagmi/chains';

if (typeof window === 'undefined') {
  const globalWithStorage = globalThis as typeof globalThis & { localStorage?: Storage };
  if (!globalWithStorage.localStorage || typeof globalWithStorage.localStorage.getItem !== 'function') {
    globalWithStorage.localStorage = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    } as Storage;
  }
}

// Use custom RPC from environment variable
const targetChain = polygon;
const envRpcUrl = process.env.NEXT_PUBLIC_RPC_URL?.trim();
const envRpcUrls = (process.env.NEXT_PUBLIC_RPC_URLS || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

const fallbackRpcUrls = [
  'https://polygon-bor-rpc.publicnode.com',
  'https://rpc.ankr.com/polygon',
  'https://polygon.drpc.org',
];

const rpcUrls = Array.from(
  new Set([
    ...(envRpcUrl ? [envRpcUrl] : []),
    ...envRpcUrls,
    ...fallbackRpcUrls,
    ...targetChain.rpcUrls.default.http,
  ])
).filter((url) => !url.includes('polygon-rpc.com'));

const customChain = {
  ...targetChain,
  rpcUrls: {
    default: {
      http: rpcUrls,
    },
    public: {
      http: rpcUrls,
    },
  },
};

export const config = getDefaultConfig({
  appName: 'OracleX',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'f6855d8485f48de979ac417de2a7abe5',
  chains: [customChain],
  transports: {
    [customChain.id]: fallback(
      rpcUrls.map((url) =>
        http(url, {
          timeout: 10_000,
          retryCount: 1,
        })
      )
    ),
  },
  ssr: false,
});
