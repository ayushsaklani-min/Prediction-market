import hre from "hardhat";
import fs from "fs";

const { ethers } = hre;

async function main() {
  console.log("🎯 Creating Test Market...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Load deployed addresses
  const deployed = JSON.parse(fs.readFileSync("deployed-v2.json", "utf8"));
  
  const factory = await ethers.getContractAt("MarketFactoryV2", deployed.contracts.MarketFactoryV2);
  const usdc = await ethers.getContractAt("TestUSDC", process.env.USDC_ADDRESS || "0x170490a94B901237bc5425f965ecEF111DEECcE1");

  const market = {
    eventId: "btc-100k-2025",
    description: "Will Bitcoin reach $100,000 by December 31, 2025?",
    category: 0,
    tags: ["bitcoin", "crypto", "price"],
    closeTimestamp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
    resolutionTimestamp: Math.floor(Date.now() / 1000) + (366 * 24 * 60 * 60),
    initialYes: ethers.parseUnits("100", 6),
    initialNo: ethers.parseUnits("100", 6)
  };

  const totalLiquidity = market.initialYes + market.initialNo;
  const creationFee = ethers.parseUnits("10", 6);
  const totalCost = totalLiquidity + creationFee;

  console.log("Total cost:", ethers.formatUnits(totalCost, 6), "USDC");
  
  // Check balance
  const balance = await usdc.balanceOf(deployer.address);
  console.log("Your balance:", ethers.formatUnits(balance, 6), "USDC\n");

  // Approve max to Factory
  console.log("Approving USDC...");
  const approveTx = await usdc.approve(deployed.contracts.MarketFactoryV2, ethers.MaxUint256);
  await approveTx.wait();
  console.log("✅ Approved\n");

  // Create market
  console.log("Creating market...");
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

  console.log("Waiting for confirmation...");
  const receipt = await createTx.wait();
  console.log("✅ Market created! TX:", receipt.hash);
}

main().catch(console.error);
