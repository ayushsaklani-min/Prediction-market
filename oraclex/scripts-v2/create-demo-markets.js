import hre from "hardhat";
import fs from "fs";

const { ethers } = hre;

async function main() {
  console.log("🎯 Creating Demo Markets...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Load deployed addresses
  const deployed = JSON.parse(fs.readFileSync("deployed-v2.json", "utf8"));
  
  const factory = await ethers.getContractAt("MarketFactoryV2", deployed.contracts.MarketFactoryV2);
  const usdc = await ethers.getContractAt("IERC20", process.env.USDC_ADDRESS || "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582");

  // Demo markets
  const demoMarkets = [
    {
      eventId: "btc-100k-2025",
      description: "Will Bitcoin reach $100,000 by December 31, 2025?",
      category: 0, // Crypto
      tags: ["bitcoin", "crypto", "price"],
      closeTimestamp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
      resolutionTimestamp: Math.floor(Date.now() / 1000) + (366 * 24 * 60 * 60),
      initialYes: ethers.parseUnits("100", 6),
      initialNo: ethers.parseUnits("100", 6)
    },
    {
      eventId: "eth-10k-2025",
      description: "Will Ethereum reach $10,000 by June 30, 2025?",
      category: 0, // Crypto
      tags: ["ethereum", "crypto", "price"],
      closeTimestamp: Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60), // 6 months
      resolutionTimestamp: Math.floor(Date.now() / 1000) + (181 * 24 * 60 * 60),
      initialYes: ethers.parseUnits("150", 6),
      initialNo: ethers.parseUnits("150", 6)
    },
    {
      eventId: "ai-agi-2025",
      description: "Will AGI (Artificial General Intelligence) be achieved by end of 2025?",
      category: 4, // Science
      tags: ["ai", "agi", "technology"],
      closeTimestamp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
      resolutionTimestamp: Math.floor(Date.now() / 1000) + (366 * 24 * 60 * 60),
      initialYes: ethers.parseUnits("100", 6),
      initialNo: ethers.parseUnits("100", 6)
    },
    {
      eventId: "polygon-zkevm-tvl",
      description: "Will Polygon zkEVM TVL exceed $1 billion by Q2 2025?",
      category: 0, // Crypto
      tags: ["polygon", "zkevm", "tvl"],
      closeTimestamp: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 3 months
      resolutionTimestamp: Math.floor(Date.now() / 1000) + (91 * 24 * 60 * 60),
      initialYes: ethers.parseUnits("200", 6),
      initialNo: ethers.parseUnits("200", 6)
    },
    {
      eventId: "chainlink-price-2025",
      description: "Will Chainlink (LINK) reach $50 by end of 2025?",
      category: 0, // Crypto
      tags: ["chainlink", "link", "price"],
      closeTimestamp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
      resolutionTimestamp: Math.floor(Date.now() / 1000) + (366 * 24 * 60 * 60),
      initialYes: ethers.parseUnits("100", 6),
      initialNo: ethers.parseUnits("100", 6)
    }
  ];

  console.log("Creating", demoMarkets.length, "demo markets...\n");

  for (const market of demoMarkets) {
    try {
      console.log(`📝 Creating: ${market.description}`);
      
      // Calculate total cost
      const totalLiquidity = market.initialYes + market.initialNo;
      const creationFee = ethers.parseUnits("10", 6);
      const totalCost = totalLiquidity + creationFee;

      // Approve USDC to Factory
      console.log("  Approving USDC to Factory...");
      let approveTx = await usdc.approve(deployed.contracts.MarketFactoryV2, totalCost);
      await approveTx.wait();
      
      // Approve USDC to AMM for liquidity
      console.log("  Approving USDC to AMM...");
      approveTx = await usdc.approve(deployed.contracts.PredictionAMM, totalLiquidity);
      await approveTx.wait();

      // Create market
      console.log("  Creating market...");
      const createTx = await factory.createMarket(
        market.eventId,
        market.description,
        market.category,
        market.tags,
        market.closeTimestamp,
        market.resolutionTimestamp,
        market.initialYes,
        market.initialNo
      );

      const receipt = await createTx.wait();
      console.log("  ✅ Market created! TX:", receipt.hash);
      console.log("");

    } catch (error) {
      console.error(`  ❌ Failed to create market:`, error.message);
      console.log("");
    }
  }

  console.log("🎉 Demo markets creation complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
