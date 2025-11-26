import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config();

const { ethers } = hre;

async function main() {
  console.log("🎯 Creating Test Market with Low Liquidity...\n");

  const [signer] = await ethers.getSigners();
  console.log("Creating from:", signer.address);

  // Contract addresses
  const USDC_ADDRESS = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
  const FACTORY_ADDRESS = "0x82032757239F37E6c42D5098c115EcD67Ce587A7";

  // ABIs
  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)"
  ];

  const FACTORY_ABI = [
    "function createMarket(string eventId, string description, uint8 category, string[] tags, uint256 closeTimestamp, uint256 resolutionTimestamp, uint256 initialYes, uint256 initialNo) external returns (bytes32)",
    "function minInitialLiquidity() external view returns (uint256)",
    "function marketCreationFee() external view returns (uint256)",
    "function setMinInitialLiquidity(uint256 newMin) external"
  ];

  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

  // Check USDC balance
  const balance = await usdc.balanceOf(signer.address);
  console.log("USDC Balance:", ethers.formatUnits(balance, 6), "USDC\n");

  if (balance < ethers.parseUnits("10", 6)) {
    console.log("❌ Insufficient USDC balance. You need at least 10 USDC.");
    console.log("Get more from: https://faucet.polygon.technology/");
    return;
  }

  // Step 1: Lower minimum liquidity requirement (admin only)
  console.log("Step 1: Lowering minimum liquidity requirement...");
  try {
    const newMin = ethers.parseUnits("2", 6); // 2 USDC per side
    const tx1 = await factory.setMinInitialLiquidity(newMin);
    console.log("Transaction hash:", tx1.hash);
    await tx1.wait();
    console.log("✅ Minimum liquidity set to 2 USDC per side\n");
  } catch (error) {
    console.log("⚠️  Could not lower minimum (not admin). Using default minimum.");
    console.log("You'll need more USDC to create a market.\n");
  }

  // Check current requirements
  const minLiquidity = await factory.minInitialLiquidity();
  const creationFee = await factory.marketCreationFee();
  
  console.log("Current Requirements:");
  console.log("- Creation Fee:", ethers.formatUnits(creationFee, 6), "USDC");
  console.log("- Min Liquidity per side:", ethers.formatUnits(minLiquidity, 6), "USDC");
  console.log("- Total needed:", ethers.formatUnits(creationFee + minLiquidity * 2n, 6), "USDC\n");

  const totalNeeded = creationFee + minLiquidity * 2n;
  
  if (balance < totalNeeded) {
    console.log("❌ Insufficient USDC for market creation.");
    console.log("You have:", ethers.formatUnits(balance, 6), "USDC");
    console.log("You need:", ethers.formatUnits(totalNeeded, 6), "USDC");
    console.log("\nOptions:");
    console.log("1. Get more USDC from faucet");
    console.log("2. Ask admin to lower minimum liquidity");
    console.log("3. Use the 10 USDC to trade on existing markets");
    return;
  }

  // Step 2: Approve USDC
  console.log("Step 2: Approving USDC...");
  const allowance = await usdc.allowance(signer.address, FACTORY_ADDRESS);
  
  if (allowance < totalNeeded) {
    const approveTx = await usdc.approve(FACTORY_ADDRESS, totalNeeded);
    console.log("Approval transaction:", approveTx.hash);
    await approveTx.wait();
    console.log("✅ USDC approved\n");
  } else {
    console.log("✅ USDC already approved\n");
  }

  // Step 3: Create market
  console.log("Step 3: Creating market...");
  
  const marketData = {
    eventId: "test-market-001",
    description: "Will ETH reach $5000 by December 31, 2024?",
    category: 0, // Crypto
    tags: ["ETH", "crypto", "price"],
    closeTimestamp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
    resolutionTimestamp: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days from now
    initialYes: minLiquidity,
    initialNo: minLiquidity
  };

  console.log("Market Details:");
  console.log("- Event:", marketData.eventId);
  console.log("- Description:", marketData.description);
  console.log("- Category: Crypto");
  console.log("- Initial Liquidity:", ethers.formatUnits(minLiquidity, 6), "USDC per side");
  console.log("- Closes in: 7 days");
  console.log("- Resolves in: 30 days\n");

  try {
    const createTx = await factory.createMarket(
      marketData.eventId,
      marketData.description,
      marketData.category,
      marketData.tags,
      marketData.closeTimestamp,
      marketData.resolutionTimestamp,
      marketData.initialYes,
      marketData.initialNo
    );

    console.log("Transaction hash:", createTx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await createTx.wait();
    console.log("✅ Market created successfully!\n");

    // Get market ID from events
    const marketCreatedEvent = receipt.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed.name === 'MarketCreated';
      } catch {
        return false;
      }
    });

    if (marketCreatedEvent) {
      const parsed = factory.interface.parseLog(marketCreatedEvent);
      const marketId = parsed.args[0];
      console.log("Market ID:", marketId);
      console.log("View on frontend: http://localhost:3000/markets/" + marketId);
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Success! Your test market is live!");
    console.log("=".repeat(60));
    console.log("\nNext steps:");
    console.log("1. Start frontend: cd frontend-v2 && npm run dev");
    console.log("2. Open: http://localhost:3000");
    console.log("3. You should see your market on the home page");
    console.log("4. Click on it to start trading!");
    console.log("\nRemaining USDC:", ethers.formatUnits(await usdc.balanceOf(signer.address), 6), "USDC");
    console.log("(Use this to trade on your market)");

  } catch (error) {
    console.error("\n❌ Error creating market:");
    console.error(error.message);
    
    if (error.message.includes("insufficient liquidity")) {
      console.log("\n💡 The minimum liquidity is too high for your balance.");
      console.log("Options:");
      console.log("1. Get more USDC from faucet");
      console.log("2. Ask admin to lower minimum liquidity");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
