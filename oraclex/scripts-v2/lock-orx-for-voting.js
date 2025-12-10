import pkg from 'hardhat';
const { ethers } = pkg;
import fs from 'fs';

async function main() {
  const [signer] = await ethers.getSigners();
  const deployed = JSON.parse(fs.readFileSync('./deployed-v2.json', 'utf8'));
  
  const orxAddress = deployed.contracts.ORXToken;
  const veOrxAddress = deployed.contracts.veORX;

  console.log('Locking ORX for voting power...');
  console.log('Wallet:', signer.address);

  const orx = await ethers.getContractAt('contracts-v2/ORXToken.sol:ORXToken', orxAddress);
  const veOrx = await ethers.getContractAt('contracts-v2/veORX.sol:veORX', veOrxAddress);

  // Lock 200 ORX for 1 year
  const lockAmount = ethers.parseUnits('200', 18);
  const lockDuration = 365 * 24 * 60 * 60; // 1 year in seconds
  const unlockTime = Math.floor(Date.now() / 1000) + lockDuration;

  console.log('\nLock Details:');
  console.log('- Amount: 200 ORX');
  console.log('- Duration: 1 year');
  console.log('- Unlock Date:', new Date(unlockTime * 1000).toLocaleString());

  // Approve veORX to spend ORX
  console.log('\n1. Approving veORX contract...');
  let tx = await orx.approve(veOrxAddress, lockAmount);
  await tx.wait();
  console.log('✅ Approved');

  // Create lock
  console.log('\n2. Creating lock...');
  tx = await veOrx.createLock(lockAmount, unlockTime);
  await tx.wait();
  console.log('✅ Lock created!');

  // Check veORX balance
  const veOrxBalance = await veOrx.balanceOf(signer.address);
  console.log('\n=== RESULTS ===');
  console.log('veORX Balance (Voting Power):', ethers.formatUnits(veOrxBalance, 18), 'veORX');

  // Check if can create proposals
  const governanceAddress = deployed.contracts.Governance;
  const governance = await ethers.getContractAt('contracts-v2/Governance.sol:OracleXGovernance', governanceAddress);
  const proposalThreshold = await governance.proposalThreshold();

  if (veOrxBalance >= proposalThreshold) {
    console.log('✅ You can now create proposals!');
  } else {
    console.log('⚠️  You need', ethers.formatUnits(proposalThreshold - veOrxBalance, 18), 'more veORX to create proposals');
  }

  console.log('\n💡 Your veORX voting power will decay linearly until the unlock date.');
  console.log('   You can increase your lock amount or extend the duration anytime.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
