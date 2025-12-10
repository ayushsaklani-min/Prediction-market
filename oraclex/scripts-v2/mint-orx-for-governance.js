import pkg from 'hardhat';
const { ethers } = pkg;
import fs from 'fs';

async function main() {
  const [signer] = await ethers.getSigners();
  const deployed = JSON.parse(fs.readFileSync('./deployed-v2.json', 'utf8'));
  
  const orxAddress = deployed.contracts.ORXToken;
  console.log('Minting ORX for:', signer.address);

  const orx = await ethers.getContractAt('contracts-v2/ORXToken.sol:ORXToken', orxAddress);
  
  // Check if we have minter role
  const MINTER_ROLE = await orx.MINTER_ROLE();
  const hasMinterRole = await orx.hasRole(MINTER_ROLE, signer.address);
  
  if (!hasMinterRole) {
    console.log('❌ You do not have MINTER_ROLE');
    console.log('Granting MINTER_ROLE to yourself...');
    
    // Check if we have admin role
    const DEFAULT_ADMIN_ROLE = await orx.DEFAULT_ADMIN_ROLE();
    const hasAdminRole = await orx.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
    
    if (!hasAdminRole) {
      console.log('❌ You do not have DEFAULT_ADMIN_ROLE either');
      console.log('Cannot mint ORX tokens');
      return;
    }
    
    const tx = await orx.grantRole(MINTER_ROLE, signer.address);
    await tx.wait();
    console.log('✅ MINTER_ROLE granted');
  }

  // Mint 1000 ORX tokens
  const amount = ethers.parseUnits('1000', 18);
  console.log('\nMinting 1000 ORX tokens...');
  
  const tx = await orx.mint(signer.address, amount);
  await tx.wait();
  
  console.log('✅ Minted 1000 ORX tokens!');
  
  const balance = await orx.balanceOf(signer.address);
  console.log('Your ORX balance:', ethers.formatUnits(balance, 18), 'ORX');
  
  console.log('\n💡 Next steps:');
  console.log('1. Go to the Governance page');
  console.log('2. Use the Staking panel to lock ORX');
  console.log('3. Lock at least 100 ORX to create proposals');
  console.log('4. The longer you lock, the more veORX voting power you get');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
