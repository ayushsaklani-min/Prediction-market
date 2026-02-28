import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const root = process.cwd();
const deployedPathV2 = path.join(root, 'deployed-v2.json');
const deployedPathLegacy = path.join(root, 'deployed.json');
const deployed = JSON.parse(
  fs.readFileSync(fs.existsSync(deployedPathV2) ? deployedPathV2 : deployedPathLegacy, 'utf8')
);

function findArtifactPath(name) {
  const hhRoot = path.join(root, 'artifacts', 'contracts');
  const fdy = path.join(root, 'out', `${name}.sol`, `${name}.json`);
  if (fs.existsSync(fdy)) return fdy;
  if (!fs.existsSync(hhRoot)) return null;
  const stack = [hhRoot];
  while (stack.length) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && e.name === `${name}.json`) return p;
    }
  }
  return null;
}

function loadArtifact(name) {
  const p = findArtifactPath(name);
  if (!p) throw new Error(`Artifact for ${name} not found. Run: npx hardhat compile`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// Oracle attestation integration
// Caller must provide cryptographic proof bytes compatible with VerifierV2.
export async function settleMarket(marketId, winningSide, proof) {
  if (!proof || proof === '0x') {
    throw new Error('Proof is required for settlement proposals.');
  }
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const art = loadArtifact('OracleAdapterV2');
  const contracts = deployed.contracts || deployed;
  if (!contracts.OracleAdapterV2) {
    throw new Error('OracleAdapterV2 address not found in deployment file');
  }
  const adapter = new ethers.Contract(contracts.OracleAdapterV2, art.abi, wallet);
  const tx = await adapter.proposeOutcome(marketId, winningSide, proof);
  return await tx.wait();
}
