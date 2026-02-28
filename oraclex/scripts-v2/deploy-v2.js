import hre from "hardhat";
import fs from "fs";
import path from "path";

const { ethers, upgrades } = hre;

async function main() {
  console.log("Starting OracleX V2 deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log("Network:", network.name, "Chain ID:", chainId, "\n");
  const multisig = process.env.MULTISIG_ADDRESS || deployer.address;
  const oracleSigner = process.env.ORACLE_SIGNER || multisig;
  const timelockMinDelay = Number(process.env.TIMELOCK_MIN_DELAY || 24 * 60 * 60);

  // Settlement token address (mainnet default, local auto-deploy fallback)
  let USDC_ADDRESS = process.env.USDC_ADDRESS || "0x6aFC2AD966a9DbB7D595D54F81AC924419f816c6";
  if (chainId === 31337 && !process.env.USDC_ADDRESS) {
    console.log("Deploying local TestUSDC for localhost demo...");
    const TestUSDC = await ethers.getContractFactory("TestUSDC");
    const testUsdc = await TestUSDC.deploy();
    await testUsdc.waitForDeployment();
    USDC_ADDRESS = await testUsdc.getAddress();
    console.log("Local TestUSDC deployed to:", USDC_ADDRESS, "\n");
  }

  const deployed = {
    network: chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      USDC: USDC_ADDRESS
    }
  };

  // 1. Deploy ORX Token
  console.log("Deploying ORX Token...");
  const ORXToken = await ethers.getContractFactory("ORXToken");
  const orxToken = await upgrades.deployProxy(ORXToken, [deployer.address], {
    initializer: "initialize",
    kind: "uups"
  });
  await orxToken.waitForDeployment();
  deployed.contracts.ORXToken = await orxToken.getAddress();
  console.log("ORX Token deployed to:", deployed.contracts.ORXToken, "\n");

  // 2. Deploy veORX
  console.log("Deploying veORX...");
  const VeORX = await ethers.getContractFactory("veORX");
  const veOrx = await upgrades.deployProxy(VeORX, [deployed.contracts.ORXToken, deployer.address], {
    initializer: "initialize",
    kind: "uups"
  });
  await veOrx.waitForDeployment();
  deployed.contracts.veORX = await veOrx.getAddress();
  console.log("veORX deployed to:", deployed.contracts.veORX, "\n");

    // 3. Deploy Governance
  console.log("Deploying Governance...");
  const Governance = await ethers.getContractFactory("SimpleGovernance");
  const governance = await upgrades.deployProxy(
    Governance,
    [deployed.contracts.veORX, deployer.address],
    { initializer: "initialize", kind: "uups" }
  );
  await governance.waitForDeployment();
  deployed.contracts.Governance = await governance.getAddress();
  console.log("Governance deployed to:", deployed.contracts.Governance, "\n");

  // 4. Deploy Market Positions (ERC1155)
  console.log("Deploying Market Positions...");
  const MarketPositions = await ethers.getContractFactory("MarketPositions");
  const positions = await upgrades.deployProxy(
    MarketPositions,
    ["https://api.oraclex.io/metadata/{id}.json", deployer.address],
    { initializer: "initialize", kind: "uups" }
  );
  await positions.waitForDeployment();
  deployed.contracts.MarketPositions = await positions.getAddress();
  console.log("Market Positions deployed to:", deployed.contracts.MarketPositions, "\n");

  // 4. Deploy Treasury
  console.log("Deploying Treasury...");
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await upgrades.deployProxy(
    Treasury,
    [ethers.ZeroAddress, ethers.ZeroAddress, deployer.address], // Will update addresses later
    { initializer: "initialize", kind: "uups" }
  );
  await treasury.waitForDeployment();
  deployed.contracts.Treasury = await treasury.getAddress();
  console.log("Treasury deployed to:", deployed.contracts.Treasury, "\n");

  // 5. Deploy Fee Distributor
  console.log("Deploying Fee Distributor...");
  const FeeDistributor = await ethers.getContractFactory("FeeDistributor");
  const feeDistributor = await upgrades.deployProxy(
    FeeDistributor,
    [deployed.contracts.veORX, USDC_ADDRESS, deployer.address],
    { initializer: "initialize", kind: "uups" }
  );
  await feeDistributor.waitForDeployment();
  deployed.contracts.FeeDistributor = await feeDistributor.getAddress();
  console.log("Fee Distributor deployed to:", deployed.contracts.FeeDistributor, "\n");

  // 6. Deploy Prediction AMM
  console.log("Deploying Prediction AMM...");
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
  console.log("Prediction AMM deployed to:", deployed.contracts.PredictionAMM, "\n");

  // 7. Deploy Verifier V2
  console.log("Deploying Verifier V2...");
  const VerifierV2 = await ethers.getContractFactory("VerifierV2");
  const verifier = await upgrades.deployProxy(VerifierV2, [deployer.address], {
    initializer: "initialize",
    kind: "uups"
  });
  await verifier.waitForDeployment();
  deployed.contracts.VerifierV2 = await verifier.getAddress();
  console.log("Verifier V2 deployed to:", deployed.contracts.VerifierV2, "\n");

  // 8. Deploy Oracle Adapter V2
  console.log("Deploying Oracle Adapter V2...");
  const OracleAdapterV2 = await ethers.getContractFactory("OracleAdapterV2");
  const oracleAdapter = await upgrades.deployProxy(
    OracleAdapterV2,
    [
      deployed.contracts.PredictionAMM,
      deployed.contracts.VerifierV2,
      ethers.parseEther("100"), // 100 native-token units as dispute stake
      deployer.address
    ],
    { initializer: "initialize", kind: "uups" }
  );
  await oracleAdapter.waitForDeployment();
  deployed.contracts.OracleAdapterV2 = await oracleAdapter.getAddress();
  console.log("Oracle Adapter V2 deployed to:", deployed.contracts.OracleAdapterV2, "\n");

  // 9. Deploy Market Factory V2
  console.log("Deploying Market Factory V2...");
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
  console.log("Market Factory V2 deployed to:", deployed.contracts.MarketFactoryV2, "\n");

  // 10. Configure roles and permissions
  console.log("Configuring roles and permissions...\n");

  // Grant MINTER_ROLE to AMM for position tokens
  const MINTER_ROLE = await positions.MINTER_ROLE();
  await positions.grantRole(MINTER_ROLE, deployed.contracts.PredictionAMM);
  console.log("Granted MINTER_ROLE to AMM");

  // Grant OPERATOR_ROLE to Factory for AMM
  const OPERATOR_ROLE = await amm.OPERATOR_ROLE();
  await amm.grantRole(OPERATOR_ROLE, deployed.contracts.MarketFactoryV2);
  await amm.grantRole(OPERATOR_ROLE, deployed.contracts.OracleAdapterV2);
  console.log("Granted OPERATOR_ROLE to Factory and Oracle");

  // Grant ORACLE_ROLE to deployer (for testing)
  const ORACLE_ROLE = await oracleAdapter.ORACLE_ROLE();
  await oracleAdapter.grantRole(ORACLE_ROLE, oracleSigner);
  console.log("Granted ORACLE_ROLE to oracle signer");

  // Grant VERIFIER_ROLE to Oracle Adapter
  const VERIFIER_ROLE = await verifier.VERIFIER_ROLE();
  await verifier.grantRole(VERIFIER_ROLE, deployed.contracts.OracleAdapterV2);
  console.log("Granted VERIFIER_ROLE to Oracle Adapter");

  // Update Treasury addresses
  await treasury.setFeeDistributor(deployed.contracts.FeeDistributor);
  console.log("Updated Treasury fee distributor\n");

  // 11. Optional governance timelock deployment (recommended for production)
  console.log("Deploying Governance Timelock...");
  const OracleXTimelock = await ethers.getContractFactory("OracleXTimelock");
  const timelock = await OracleXTimelock.deploy(
    timelockMinDelay,
    [deployed.contracts.Governance, multisig], // proposers (DAO + multisig)
    [ethers.ZeroAddress], // executors (open execution after delay)
    multisig
  );
  await timelock.waitForDeployment();
  deployed.contracts.OracleXTimelock = await timelock.getAddress();
  console.log("Governance Timelock deployed to:", deployed.contracts.OracleXTimelock);
  console.log("Timelock admin/proposer set to:", multisig, "\n");
  // 12. Move admin controls behind timelock/multisig
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const AMM_UPGRADER_ROLE = await amm.UPGRADER_ROLE();
  const AMM_PAUSER_ROLE = await amm.PAUSER_ROLE();
  const FACTORY_UPGRADER_ROLE = await factory.UPGRADER_ROLE();
  const FACTORY_PAUSER_ROLE = await factory.PAUSER_ROLE();
  const ORACLE_DISPUTE_ROLE = await oracleAdapter.DISPUTE_RESOLVER_ROLE();
  const ORACLE_PAUSER_ROLE = await oracleAdapter.PAUSER_ROLE();
  const ORACLE_UPGRADER_ROLE = await oracleAdapter.UPGRADER_ROLE();
  const VERIFIER_UPGRADER_ROLE = await verifier.UPGRADER_ROLE();
  const GOVERNANCE_UPGRADER_ROLE = await governance.UPGRADER_ROLE();
  const POSITIONS_UPGRADER_ROLE = await positions.UPGRADER_ROLE();
  const TREASURY_UPGRADER_ROLE = await treasury.UPGRADER_ROLE();
  const FEEDIST_UPGRADER_ROLE = await feeDistributor.UPGRADER_ROLE();

  await positions.grantRole(DEFAULT_ADMIN_ROLE, deployed.contracts.OracleXTimelock);
  await amm.grantRole(DEFAULT_ADMIN_ROLE, deployed.contracts.OracleXTimelock);
  await factory.grantRole(DEFAULT_ADMIN_ROLE, deployed.contracts.OracleXTimelock);
  await oracleAdapter.grantRole(DEFAULT_ADMIN_ROLE, deployed.contracts.OracleXTimelock);
  await verifier.grantRole(DEFAULT_ADMIN_ROLE, deployed.contracts.OracleXTimelock);
  await governance.grantRole(DEFAULT_ADMIN_ROLE, deployed.contracts.OracleXTimelock);
  await treasury.grantRole(DEFAULT_ADMIN_ROLE, deployed.contracts.OracleXTimelock);
  await feeDistributor.grantRole(DEFAULT_ADMIN_ROLE, deployed.contracts.OracleXTimelock);

  await amm.grantRole(AMM_UPGRADER_ROLE, deployed.contracts.OracleXTimelock);
  await amm.grantRole(AMM_PAUSER_ROLE, multisig);
  await factory.grantRole(FACTORY_UPGRADER_ROLE, deployed.contracts.OracleXTimelock);
  await factory.grantRole(FACTORY_PAUSER_ROLE, multisig);
  await oracleAdapter.grantRole(ORACLE_DISPUTE_ROLE, multisig);
  await oracleAdapter.grantRole(ORACLE_PAUSER_ROLE, multisig);
  await oracleAdapter.grantRole(ORACLE_UPGRADER_ROLE, deployed.contracts.OracleXTimelock);
  await verifier.grantRole(VERIFIER_UPGRADER_ROLE, deployed.contracts.OracleXTimelock);
  await governance.grantRole(GOVERNANCE_UPGRADER_ROLE, deployed.contracts.OracleXTimelock);
  await positions.grantRole(POSITIONS_UPGRADER_ROLE, deployed.contracts.OracleXTimelock);
  await treasury.grantRole(TREASURY_UPGRADER_ROLE, deployed.contracts.OracleXTimelock);
  await feeDistributor.grantRole(FEEDIST_UPGRADER_ROLE, deployed.contracts.OracleXTimelock);

  await positions.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);
  await amm.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);
  await factory.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);
  await oracleAdapter.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);
  await verifier.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);
  await governance.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);
  await treasury.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);
  await feeDistributor.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);

  console.log("Admin and upgrader roles moved behind timelock/multisig");

  // Save deployment info
  const deployedPath = path.join(process.cwd(), "deployed-v2.json");
  fs.writeFileSync(deployedPath, JSON.stringify(deployed, null, 2));
  console.log("Deployment info saved to:", deployedPath, "\n");

  // Print summary
  console.log("Deployment complete.\n");
  console.log("=".repeat(60));
  console.log("Contract Addresses:");
  console.log("=".repeat(60));
  for (const [name, address] of Object.entries(deployed.contracts)) {
    console.log(`${name.padEnd(25)} ${address}`);
  }
  console.log("=".repeat(60));
  console.log("\nAll contracts deployed and configured successfully.");
  console.log("\nNext steps:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Set up oracle attestation signer + proof policy");
  console.log("3. Configure frontend with new addresses and subgraph URL");
  console.log("4. Transfer admin roles to multisig/timelock");
  console.log("5. Run integration + security tests");
  console.log("6. Deploy subgraph for indexing");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




