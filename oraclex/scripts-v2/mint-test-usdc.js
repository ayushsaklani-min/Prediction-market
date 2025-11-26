import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config();

const { ethers } = hre;

// Mock USDC ABI for minting (testnet only)
const MOCK_USDC_ABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

async function main() {
  console.log("🪙 Minting Testnet USDC...\n");

  const [signer] = await ethers.getSigners();
  console.log("Minting to:", signer.address);

  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
  
  const usdc = new ethers.Contract(USDC_ADDRESS, MOCK_USDC_ABI, signer);

  try {
    // Check current balance
    const balanceBefore = await usdc.balanceOf(signer.address);
    console.log("Current USDC balance:", ethers.formatUnits(balanceBefore, 6), "USDC\n");

    // Mint 10,000 USDC (for testing)
    const amount = ethers.parseUnits("10000", 6);
    console.log("Minting 10,000 USDC...");
    
    const tx = await usdc.mint(signer.address, amount);
    console.log("Transaction hash:", tx.hash);
    
    await tx.wait();
    console.log("✅ Minted successfully!\n");

    // Check new balance
    const balanceAfter = await usdc.balanceOf(signer.address);
    console.log("New USDC balance:", ethers.formatUnits(balanceAfter, 6), "USDC");

  } catch (error) {
    console.error("❌ Error minting USDC:");
    console.error(error.message);
    console.log("\n💡 Note: This testnet USDC might not have a public mint function.");
    console.log("You may need to:");
    console.log("1. Use a faucet: https://faucet.polygon.technology/");
    console.log("2. Or swap POL for USDC on a testnet DEX");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
