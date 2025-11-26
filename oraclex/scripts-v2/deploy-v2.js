import hre from "hardhat";
import fs from "fs";
import path from "path";

const { ethers, upgrades } = hre;

async function main() {
  console.log("🚀 Deploying OracleX V2 Protocol...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log("Network:", network.name, "Chain ID:", chainId, "\n");

  // USDC address (update for your network)
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"; // Polygon Amoy

  const deployed = {
    network: chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  // 1. Deploy ORX Token
  console.log("📝 Deploying ORX Token...");
  const ORXToken = await ethers.getContractFactory("ORXToken");
  const orxToken = await upgrades.deployProxy(ORXToken, [deployer.address], {
    initializer: "initialize",
    kind: "uups"
  });
  await orxToken.waitForDeployment();
  deployed.contracts.ORXToken = await orxToken.getAddress();
  console.log("✅ ORX Token deployed to:", deployed.contracts.ORXToken, "\n");

  // 2. Deploy veORX
  console.log("📝 Deploying veORX...");
  const VeORX = await ethers.getContractFactory("veORX");
  const veOrx = await upgrades.deployProxy(VeORX, [deployed.contracts.ORXToken, deployer.address], {
    initializer: "initialize",
    kind: "uups"
  });
  await veOrx.waitForDeployment();
  deployed.contracts.veORX = await veOrx.getAddress();
  console.log("✅ veORX deployed to:", deployed.contracts.veORX, "\n");

  // 3. Deploy Market Positions (ERC1155)
  console.log("📝 Deploying Market Positions...");
  const MarketPositions = await ethers.getContractFactory("MarketPositions");
  const positions = await upgrades.deployProxy(
    MarketPositions,
    ["https://api.oraclex.io/metadata/{id}.json", deployer.address],
    { initializer: "initialize", kind: "uups" }
  );
  await positions.waitForDeployment();
  deployed.contracts.MarketPositions = await positions.getAddress();
  console.log("✅ Market Positions deployed to:", deployed.contracts.MarketPositions, "\n");

  // 4. Deploy Treasury
  console.log("📝 Deploying Treasury...");
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await upgrades.deployProxy(
    Treasury,
    [ethers.ZeroAddress, ethers.ZeroAddress, deployer.address], // Will update addresses later
    { initializer: "initialize", kind: "uups" }
  );
  await treasury.waitForDeployment();
  deployed.contracts.Treasury = await treasury.getAddress();
  console.log("✅ Treasury deployed to:", deployed.contracts.Treasury, "\n");

  // 5. Deploy Fee Distributor
  console.log("📝 Deploying Fee Distributor...");
  const FeeDistributor = await ethers.getContractFactory("FeeDistributor");
  const feeDistributor = await upgrades.deployProxy(
    FeeDistributor,
    [deployed.contracts.veORX, USDC_ADDRESS, deployer.address],
    { initializer: "initialize", kind: "uups" }
  );
  await feeDistributor.waitForDeployment();
  deployed.contracts.FeeDistributor = await feeDistributor.getAddress();
  console.log("✅ Fee Distributor deployed to:", deployed.contracts.FeeDistributor, "\n");

  // 6. Deploy Prediction AMM
  console.log("📝 Deploying Prediction AMM...");
  const PredictionAMM = await ethers.getContractFactory("PredictionAMM");
  const amm = await upgrades.deployProxy(
    PredictionAMM,
    [
      USDC_ADDRESS,
      deployed.contracts.MarketPositions,
      deployed.contracts.Treasury,
      deployed.contracts.FeeDistributor,
      deployer.address
    ],
    { initializer: "initialize", kind: "uups" }
  );
  await amm.waitForDeployment();
  deployed.contracts.PredictionAMM = await amm.getAddress();
  console.log("✅ Prediction AMM deployed to:", deployed.contracts.PredictionAMM, "\n");

  // 7. Deploy Verifier V2
  console.log("📝 Deploying Verifier V2...");
  const VerifierV2 = await ethers.getContractFactory("VerifierV2");
  const verifier = await upgrades.deployProxy(VerifierV2, [deployer.address], {
    initializer: "initialize",
    kind: "uups"
  });
  await verifier.waitForDeployment();
  deployed.contracts.VerifierV2 = await verifier.getAddress();
  console.log("✅ Verifier V2 deployed to:", deployed.contracts.VerifierV2, "\n");

  // 8. Deploy Oracle Adapter V2
  console.log("📝 Deploying Oracle Adapter V2...");
  const OracleAdapterV2 = await ethers.getContractFactory("OracleAdapterV2");
  const oracleAdapter = await upgrades.deployProxy(
    OracleAdapterV2,
    [
      deployed.contracts.PredictionAMM,
      deployed.contracts.VerifierV2,
      ethers.parseEther("100"), // 100 ORX dispute stake
      deployer.address
    ],
    { initializer: "initialize", kind: "uups" }
  );
  await oracleAdapter.waitForDeployment();
  deployed.contracts.OracleAdapterV2 = await oracleAdapter.getAddress();
  console.log("✅ Oracle Adapter V2 deployed to:", deployed.contracts.OracleAdapterV2, "\n");

  // 9. Deploy Market Factory V2
  console.log("📝 Deploying Market Factory V2...");
  const MarketFactoryV2 = await ethers.getContractFactory("MarketFactoryV2");
  const factory = await upgrades.deployProxy(
    MarketFactoryV2,
    [
      USDC_ADDRESS,
      deployed.contracts.PredictionAMM,
      deployed.contracts.Treasury,
      ethers.parseUnits("10", 6), // 10 USDC creation fee
      ethers.parseUnits("100", 6), // 100 USDC min liquidity
      deployer.address
    ],
    { initializer: "initialize", kind: "uups" }
  );
  await factory.waitForDeployment();
  deployed.contracts.MarketFactoryV2 = await factory.getAddress();
  console.log("✅ Market Factory V2 deployed to:", deployed.contracts.MarketFactoryV2, "\n");

  // 10. Configure roles and permissions
  console.log("⚙️  Configuring roles and permissions...\n");

  // Grant MINTER_ROLE to AMM for position tokens
  const MINTER_ROLE = await positions.MINTER_ROLE();
  await positions.grantRole(MINTER_ROLE, deployed.contracts.PredictionAMM);
  console.log("✅ Granted MINTER_ROLE to AMM");

  // Grant OPERATOR_ROLE to Factory for AMM
  const OPERATOR_ROLE = await amm.OPERATOR_ROLE();
  await amm.grantRole(OPERATOR_ROLE, deployed.contracts.MarketFactoryV2);
  await amm.grantRole(OPERATOR_ROLE, deployed.contracts.OracleAdapterV2);
  console.log("✅ Granted OPERATOR_ROLE to Factory and Oracle");

  // Grant ORACLE_ROLE to deployer (for testing)
  const ORACLE_ROLE = await oracleAdapter.ORACLE_ROLE();
  await oracleAdapter.grantRole(ORACLE_ROLE, deployer.address);
  console.log("✅ Granted ORACLE_ROLE to deployer");

  // Grant VERIFIER_ROLE to Oracle Adapter
  const VERIFIER_ROLE = await verifier.VERIFIER_ROLE();
  await verifier.grantRole(VERIFIER_ROLE, deployed.contracts.OracleAdapterV2);
  console.log("✅ Granted VERIFIER_ROLE to Oracle Adapter");

  // Update Treasury addresses
  await treasury.setFeeDistributor(deployed.contracts.FeeDistributor);
  console.log("✅ Updated Treasury fee distributor\n");

  // Save deployment info
  const deployedPath = path.join(process.cwd(), "deployed-v2.json");
  fs.writeFileSync(deployedPath, JSON.stringify(deployed, null, 2));
  console.log("💾 Deployment info saved to:", deployedPath, "\n");

  // Print summary
  console.log("🎉 Deployment Complete!\n");
  console.log("=".repeat(60));
  console.log("Contract Addresses:");
  console.log("=".repeat(60));
  for (const [name, address] of Object.entries(deployed.contracts)) {
    console.log(`${name.padEnd(25)} ${address}`);
  }
  console.log("=".repeat(60));
  console.log("\n✅ All contracts deployed and configured successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Set up Chainlink Functions subscription");
  console.log("3. Configure frontend with new addresses");
  console.log("4. Run integration tests");
  console.log("5. Deploy subgraph for indexing");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
