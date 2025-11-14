import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const root = process.cwd();
const deployed = JSON.parse(fs.readFileSync(path.join(root, 'deployed.json'), 'utf8'));

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

// Chainlink Functions integration
// This function should be called by Chainlink Functions DON to settle markets
export async function settleMarket(marketId, winningSide) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const art = loadArtifact('OracleXOracleAdapter');
  const adapter = new ethers.Contract(deployed.OracleXOracleAdapter, art.abi, wallet);
  const tx = await adapter.pushOutcome(marketId, winningSide);
  return await tx.wait();
}
