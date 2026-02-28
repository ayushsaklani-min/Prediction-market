const POLYGON_CHAIN_ID = 137;

export function getTargetChainId(): number {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  return Number.isFinite(chainId) && chainId > 0 ? chainId : POLYGON_CHAIN_ID;
}

export function getTargetNetworkName(chainId: number = getTargetChainId()): string {
  if (chainId === POLYGON_CHAIN_ID) return 'Polygon Mainnet';
  return `Chain ${chainId}`;
}

export function getSupportedNetworkIds(): number[] {
  return [POLYGON_CHAIN_ID];
}
