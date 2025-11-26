import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config();

const { ethers } = hre;

async function main() {
  console.log("🔧 Lowering Minimum Liquidity Requirement...\n");

  const [signer] = await ethers.getSigners();
  console.log("Admin:", signer.address);

  const FACTORY_ADDRESS = "0x82032757239F37E6c42D5098c115EcD67Ce587A7";

  const FACTORY_ABI = [
    "function setMinInitialLiquidity(uint256 newMin) external",
    "function minInitialLiquidity() external view returns (uint256)",
    "function marketCreationFee() external view returns (uint256)"
  ];

  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

  // Check current settings
  const currentMin = await factory.minInitialLiquidity();
  const fee = await factory.marketCreationFee();
  
  console.log("Current Settings:");
  console.log("- Creation Fee:", ethers.formatUnits(fee, 6), "USDC");
  console.log("- Min Liquidity per side:", ethers.formatUnits(currentMin, 6), "USDC");
  console.log("- Total needed:", ethers.formatUnits(fee + currentMin * 2n, 6), "USDC\n");

  // Lower to 2 USDC per side (total 4 USDC + 10 USDC fee = 14 USDC needed)
  // But you only have 10 USDC, so let's make it even lower
  const newMin = ethers.parseUnits("0.1", 6); // 0.1 USDC per side
  
  console.log("Lowering minimum liquidity to 0.1 USDC per side...");
  console.log("New total needed: 10.2 USDC (10 fee + 0.2 liquidity)\n");

  try {
    const tx = await factory.setMinInitialLiquidity(newMin);
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("✅ Minimum liquidity updated!\n");

    const newMinCheck = await factory.minInitialLiquidity();
    console.log("New Settings:");
    console.log("- Min Liquidity per side:", ethers.formatUnits(newMinCheck, 6), "USDC");
    console.log("- Total needed:", ethers.formatUnits(fee + newMinCheck * 2n, 6), "USDC");
    console.log("\n🎉 You can now create a market with just 10.2 USDC!");
    console.log("But you only have 10 USDC, so you'll need 0.2 more USDC.");
    console.log("\nAlternatively, I can also lower the creation fee to 0 USDC for testing.");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.message.includes("AccessControl")) {
      console.log("\n💡 You're not the admin. Only the deployer can change settings.");
      console.log("Deployer address: 0x48E8750b87278227b5BBd53cae998e6083910bd9");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
