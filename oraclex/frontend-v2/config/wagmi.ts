'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonAmoy } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'OracleX',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'f6855d8485f48de979ac417de2a7abe5',
  chains: [polygonAmoy, polygon],
  ssr: true,
});
