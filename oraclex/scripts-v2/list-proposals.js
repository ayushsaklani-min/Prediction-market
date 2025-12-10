import hre from "hardhat";

async function main() {
  const governanceAddress = "0x4C5017777e234E716c7e44FbFF75ee394646DD16";
  
  console.log("Fetching all proposals from Governance contract...");
  console.log("Governance:", governanceAddress);
  console.log();
  
  // Get ProposalCreated events
  const governance = await hre.ethers.getContractAt("SimpleGovernance", governanceAddress);
  
  const filter = governance.filters.ProposalCreated();
  const events = await governance.queryFilter(filter);
  
  console.log(`Found ${events.length} proposal(s):\n`);
  
  for (const event of events) {
    const proposalId = event.args.proposalId;
    const proposer = event.args.proposer;
    const description = event.args.description;
    const voteStart = event.args.voteStart;
    const voteEnd = event.args.voteEnd;
    
    // Get proposal state
    const state = await governance.state(proposalId);
    const stateNames = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'];
    
    // Get votes
    const votes = await governance.proposalVotes(proposalId);
    
    // Parse title from description
    const titleMatch = description.match(/^#\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
    
    console.log("─".repeat(60));
    console.log(`Proposal ID: ${proposalId.toString()}`);
    console.log(`Title: ${title}`);
    console.log(`Proposer: ${proposer}`);
    console.log(`Status: ${stateNames[state]}`);
    console.log(`Vote Start Block: ${voteStart.toString()}`);
    console.log(`Vote End Block: ${voteEnd.toString()}`);
    console.log(`\nVotes:`);
    console.log(`  Against: ${hre.ethers.formatEther(votes[0])} veORX`);
    console.log(`  For: ${hre.ethers.formatEther(votes[1])} veORX`);
    console.log(`  Abstain: ${hre.ethers.formatEther(votes[2])} veORX`);
    console.log();
  }
  
  if (events.length === 0) {
    console.log("⚠️  No proposals found. Make sure you created a proposal first.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
