import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config();

const { ethers } = hre;

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)"
];

async function main() {
  console.log("💰 Checking Balances...\n");

  const [signer] = await ethers.getSigners();
  const address = signer.address;
  
  console.log("Address:", address);
  console.log("Explorer:", `https://amoy.polygonscan.com/address/${address}\n`);

  // Check POL balance
  const polBalance = await ethers.provider.getBalance(address);
  console.log("POL Balance:", ethers.formatEther(polBalance), "POL");

  // Check USDC balance
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
  
  try {
    const usdcBalance = await usdc.balanceOf(address);
    const decimals = await usdc.decimals();
    console.log("USDC Balance:", ethers.formatUnits(usdcBalance, decimals), "USDC");
  } catch (error) {
    console.log("USDC Balance: Error reading balance");
  }

  // Check ORX balance
  const ORX_ADDRESS = "0xf5f5424A78657E374F1018307c07323696e3A6b3";
  const orx = new ethers.Contract(ORX_ADDRESS, ERC20_ABI, signer);
  
  try {
    const orxBalance = await orx.balanceOf(address);
    console.log("ORX Balance:", ethers.formatEther(orxBalance), "ORX");
  } catch (error) {
    console.log("ORX Balance: Error reading balance");
  }

  console.log("\n" + "=".repeat(60));
  console.log("📋 How to Get Testnet USDC:");
  console.log("=".repeat(60));
  console.log("\n1. Polygon Faucet (Recommended):");
  console.log("   Visit: https://faucet.polygon.technology/");
  console.log("   - Select 'Polygon Amoy'");
  console.log("   - Select 'USDC'");
  console.log("   - Enter your address:", address);
  console.log("   - Complete captcha and request");
  
  console.log("\n2. Aave Faucet:");
  console.log("   Visit: https://staging.aave.com/faucet/");
  console.log("   - Connect wallet");
  console.log("   - Select Polygon Amoy");
  console.log("   - Request USDC");
  
  console.log("\n3. Circle Faucet:");
  console.log("   Visit: https://faucet.circle.com/");
  console.log("   - Select Polygon Amoy");
  console.log("   - Request USDC");

  console.log("\n4. Swap POL for USDC:");
  console.log("   Visit: https://app.uniswap.org/");
  console.log("   - Switch to Polygon Amoy");
  console.log("   - Swap POL → USDC");

  console.log("\n" + "=".repeat(60));
  console.log("💡 Tip: You need ~210 USDC to create a market");
  console.log("   - 10 USDC creation fee");
  console.log("   - 200 USDC initial liquidity (100 YES + 100 NO)");
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
