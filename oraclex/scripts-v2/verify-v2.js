import fs from 'fs';
import path from 'path';
import hre from 'hardhat';

async function main() {
  const deployedPath = path.join(process.cwd(), 'deployed-v2.json');
  if (!fs.existsSync(deployedPath)) {
    throw new Error(`Deployment file not found: ${deployedPath}`);
  }

  const deployed = JSON.parse(fs.readFileSync(deployedPath, 'utf8'));
  const contracts = deployed.contracts || {};
  const entries = Object.entries(contracts);

  if (entries.length === 0) {
    throw new Error('No contracts found in deployed-v2.json');
  }

  for (const [name, address] of entries) {
    if (!address) continue;
    try {
      console.log(`Verifying ${name} at ${address}...`);
      await hre.run('verify:verify', { address });
      console.log(`Verified ${name}`);
    } catch (error) {
      const message = String(error?.message || error);
      if (message.toLowerCase().includes('already verified')) {
        console.log(`${name} already verified`);
        continue;
      }
      console.warn(`Verification failed for ${name}: ${message}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
