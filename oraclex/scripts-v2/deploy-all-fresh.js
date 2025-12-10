import pkg from 'hardhat';
const { ethers, upgrades } = pkg;
import fs from 'fs';

async function main() {
  console.log('🚀 Deploying ALL contracts with TestUSDC...\n');
  console.log('This will take 5-10 minutes. Please wait...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);

  const testUsdcAddress = '0x170490a94B901237bc5425f965ecEF111DEECcE1';
  console.log('TestUSDC:', testUsdcAddress);

  const contracts = {};

  // 1. Deploy ORXToken (reuse existing)
  console.log('\n1️⃣  Using existing ORXToken...');
  contracts.ORXToken = '0xf5f5424A78657E374F1018307c07323696e3A6b3';
  console.log('✅', contracts.ORXToken);

  // 2. Deploy veORX (reuse existing)
  console.log('\n2️⃣  Using existing veORX...');
  contracts.veORX = '0x351dA233FaF06B43440E35EE6d48721bfBD3Ca92';
  console.log('✅', contracts.veORX);

  // 3. Deploy Treasury (reuse existing)
  console.log('\n3️⃣  Using existing Treasury...');
  contracts.Treasury = '0xE0880C17bE8c6c5dd5611440299A4e5d223a488f';
  console.log('✅', contracts.Treasury);

  // 4. Deploy FeeDistributor (reuse existing)
  console.log('\n4️⃣  Using existing FeeDistributor...');
  contracts.FeeDistributor = '0x53756cfd49Cc9354C10cafddD0d6a63Fe77a6bdf';
  console.log('✅', contracts.FeeDistributor);

  // 5. Deploy PredictionAMM (with ZeroAddress for positions initially)
  console.log('\n5️⃣  Deploying PredictionAMM...');
  const PredictionAMM = await ethers.getContractFactory('PredictionAMM');
  const amm = await upgrades.deployProxy(
    PredictionAMM,
    [
      testUsdcAddress,
      ethers.ZeroAddress, // positions - will be set later
      contracts.Treasury,
      contracts.FeeDistributor,
      deployer.address
    ],
    { initializer: 'initialize', kind: 'uups' }
  );
  await amm.waitForDeployment();
  contracts.PredictionAMM = await amm.getAddress();
  console.log('✅', contracts.PredictionAMM);

  // 6. Deploy MarketPositions
  console.log('\n6️⃣  Deploying MarketPositions...');
  const MarketPositions = await ethers.getContractFactory('MarketPositions');
  const positions = await upgrades.deployProxy(
    MarketPositions,
    [contracts.PredictionAMM, deployer.address],
    { initializer: 'initialize', kind: 'uups' }
  );
  await positions.waitForDeployment();
  contracts.MarketPositions = await positions.getAddress();
  console.log('✅', contracts.MarketPositions);

  // 7. Deploy MarketFactoryV2
  console.log('\n7️⃣  Deploying MarketFactoryV2...');
  const MarketFactory = await ethers.getContractFactory('MarketFactoryV2');
  const factory = await upgrades.deployProxy(
    MarketFactory,
    [
      testUsdcAddress,
      contracts.PredictionAMM,
      contracts.Treasury,
      ethers.parseUnits('10', 6), // 10 USDC creation fee
      ethers.parseUnits('10', 6),  // 10 USDC min liquidity per side
      deployer.address
    ],
    { initializer: 'initialize', kind: 'uups' }
  );
  await factory.waitForDeployment();
  contracts.MarketFactoryV2 = await factory.getAddress();
  console.log('✅', contracts.MarketFactoryV2);

  // 8. Deploy VerifierV2
  console.log('\n8️⃣  Deploying VerifierV2...');
  const Verifier = await ethers.getContractFactory('VerifierV2');
  const verifier = await upgrades.deployProxy(
    Verifier,
    [deployer.address],
    { initializer: 'initialize', kind: 'uups' }
  );
  await verifier.waitForDeployment();
  contracts.VerifierV2 = await verifier.getAddress();
  console.log('✅', contracts.VerifierV2);

  // 9. Deploy OracleAdapterV2
  console.log('\n9️⃣  Deploying OracleAdapterV2...');
  const OracleAdapter = await ethers.getContractFactory('OracleAdapterV2');
  const oracle = await upgrades.deployProxy(
    OracleAdapter,
    [
      contracts.PredictionAMM,
      contracts.VerifierV2,
      ethers.parseEther('10'), // 10 tokens dispute stake
      deployer.address
    ],
    { initializer: 'initialize', kind: 'uups' }
  );
  await oracle.waitForDeployment();
  contracts.OracleAdapterV2 = await oracle.getAddress();
  console.log('✅', contracts.OracleAdapterV2);

  // Note: Configuration is set in initialize functions
  console.log('\n✅ All contracts deployed and configured!');

  // Save deployment
  const deployment = {
    network: 80002,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    usdc: testUsdcAddress,
    contracts
  };

  fs.writeFileSync('./deployed-v2.json', JSON.stringify(deployment, null, 2));
  console.log('\n💾 Deployment saved to deployed-v2.json');

  console.log('\n' + '='.repeat(80));
  console.log('✅ DEPLOYMENT COMPLETE!');
  console.log('='.repeat(80));
  console.log('\n📋 Contract Addresses:');
  console.log('  TestUSDC:         ', testUsdcAddress);
  console.log('  ORXToken:         ', contracts.ORXToken);
  console.log('  veORX:            ', contracts.veORX);
  console.log('  Treasury:         ', contracts.Treasury);
  console.log('  FeeDistributor:   ', contracts.FeeDistributor);
  console.log('  PredictionAMM:    ', contracts.PredictionAMM);
  console.log('  MarketPositions:  ', contracts.MarketPositions);
  console.log('  MarketFactoryV2:  ', contracts.MarketFactoryV2);
  console.log('  OracleAdapterV2:  ', contracts.OracleAdapterV2);
  console.log('  VerifierV2:       ', contracts.VerifierV2);

  console.log('\n📝 Next steps:');
  console.log('1. Update frontend .env.local with new addresses');
  console.log('2. Restart the frontend dev server');
  console.log('3. Create markets using your 1M TestUSDC!');
  
  console.log('\n🎉 You can now create unlimited markets with your TestUSDC!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
