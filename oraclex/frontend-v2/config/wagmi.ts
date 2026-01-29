'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon } from 'wagmi/chains';
import { http } from 'viem';

// Use custom RPC from environment variable
const customPolygon = {
  ...polygon,
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://polygon-rpc.com'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://polygon-rpc.com'],
    },
  },
};

export const config = getDefaultConfig({
  appName: 'OracleX',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'f6855d8485f48de979ac417de2a7abe5',
  chains: [customPolygon],
  ssr: true,
});
