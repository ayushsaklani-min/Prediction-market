import hre from "hardhat";

async function main() {
  const [signer] = await hre.ethers.getSigners();
  
  const governanceAddress = "0x4C5017777e234E716c7e44FbFF75ee394646DD16";
  const veORXAddress = "0xEcde5DC1B5e9634c5f58F3F0E016De734EccBfFE";
  
  const governance = await hre.ethers.getContractAt("SimpleGovernance", governanceAddress);
  const veORX = await hre.ethers.getContractAt("veORX", veORXAddress);
  
  console.log("Creating governance proposal...");
  console.log("User:", signer.address);
  console.log("Governance:", governanceAddress);
  console.log();
  
  const currentBlock = await hre.ethers.provider.getBlockNumber();
  console.log("Current block:", currentBlock);
  
  const currentBalance = await veORX.balanceOf(signer.address);
  console.log("Current veORX balance:", hre.ethers.formatEther(currentBalance));
  
  const currentVotes = await veORX.getVotes(signer.address);
  console.log("Current votes (getVotes):", hre.ethers.formatEther(currentVotes));
  
  // Check past votes
  if (currentBlock > 1) {
    try {
      const pastVotes = await veORX.getPastVotes(signer.address, currentBlock - 1);
      console.log("Past votes (block", currentBlock - 1, "):", hre.ethers.formatEther(pastVotes));
    } catch (e) {
      console.log("⚠️  No past votes recorded yet");
    }
  }
  
  const threshold = await governance.proposalThreshold();
  console.log("\nProposal threshold:", hre.ethers.formatEther(threshold));
  
  // Create proposal
  const description = `# Reduce Trading Fees by 20%

## Summary
This proposal aims to reduce trading fees on the OracleX platform by 20% to increase competitiveness and drive user adoption.

## Rationale
- Lower fees will attract more traders
- Increased volume will offset the fee reduction
- Better market liquidity benefits all users
- Competitive advantage over other prediction markets

## Implementation
Update the fee parameters in the PredictionAMM contract from current levels to 20% lower.

## Timeline
If approved, changes will be implemented within 7 days.`;
  
  console.log("\n📝 Creating proposal...");
  console.log("Title: Reduce Trading Fees by 20%");
  
  try {
    // OpenZeppelin Governor requires at least one action
    // Use a dummy action (call to zero address with no data) for signal votes
    const tx = await governance.propose(
      [hre.ethers.ZeroAddress], // targets
      [0n], // values
      ["0x"], // calldatas
      description
    );
    
    console.log("\n⏳ Waiting for transaction confirmation...");
    const receipt = await tx.wait();
    
    console.log("\n✅ Proposal created successfully!");
    console.log("Transaction hash:", receipt.hash);
    console.log("Block number:", receipt.blockNumber);
    
    // Try to extract proposal ID from events
    for (const log of receipt.logs) {
      try {
        const parsed = governance.interface.parseLog(log);
        if (parsed && parsed.name === "ProposalCreated") {
          console.log("\n🎉 Proposal ID:", parsed.args.proposalId.toString());
          break;
        }
      } catch (e) {
        // Skip logs that don't match
      }
    }
    
    console.log("\n🌐 View in frontend: http://localhost:3000/governance");
    
  } catch (error) {
    console.error("\n❌ Error creating proposal:");
    console.error("Full error:", error);
    if (error.message.includes("GovernorInsufficientProposerVotes")) {
      console.log("\n⚠️  Insufficient voting power at snapshot block");
      console.log("The governance contract checks voting power from a PAST block, not current block");
      console.log("You need to wait a few more blocks after locking tokens");
      console.log("\nTry running this script again in 30 seconds");
    } else if (error.message.includes("execution reverted")) {
      console.log("\n⚠️  Transaction reverted");
      console.log("This usually means you need to wait for more blocks to pass");
      console.log("Try again in 30 seconds");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
