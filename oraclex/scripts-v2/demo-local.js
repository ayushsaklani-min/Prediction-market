import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

const root = process.cwd();
const hardhatPk = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const rpcUrl = "http://127.0.0.1:8545";

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: true, ...options });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

async function waitForRpc(timeoutMs = 30000) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await provider.getBlockNumber();
      return;
    } catch (_) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("Hardhat RPC did not start in time");
}

function spawnDetached(cmd, args, options = {}) {
  const child = spawn(cmd, args, { stdio: "inherit", shell: true, ...options });
  return child;
}

async function main() {
  console.log("Starting local Hardhat node...");
  const nodeProc = spawnDetached("npx", ["hardhat", "node", "--hostname", "127.0.0.1", "--port", "8545", "--config", "hardhat-v2.config.js"]);

  const cleanup = () => {
    if (!nodeProc.killed) nodeProc.kill("SIGINT");
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  await waitForRpc();

  const deployEnv = {
    ...process.env,
    RPC_URL: rpcUrl,
    PRIVATE_KEY: hardhatPk,
    MULTISIG_ADDRESS: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    ORACLE_SIGNER: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    TIMELOCK_MIN_DELAY: "60",
  };

  console.log("Deploying contracts to localhost...");
  await run("npx", ["hardhat", "run", "scripts-v2/deploy-v2.js", "--network", "localhost"], { env: deployEnv });

  console.log("Creating demo markets...");
  await run("npx", ["hardhat", "run", "scripts-v2/create-demo-markets.js", "--network", "localhost"], { env: deployEnv });

  const deployedPath = path.join(root, "deployed-v2.json");
  const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
  const c = deployed.contracts;

  console.log("Starting backend and frontend...");
  const backendEnv = {
    ...process.env,
    RPC_URL: rpcUrl,
    PRIVATE_KEY: hardhatPk,
    ADMIN_API_KEY: "local-dev-admin-key",
    ENABLE_DIRECT_SETTLEMENT: "true",
    BACKEND_PORT: "4000",
  };
  const frontendEnv = {
    ...process.env,
    NEXT_PUBLIC_CHAIN_ID: "31337",
    NEXT_PUBLIC_RPC_URL: rpcUrl,
    NEXT_PUBLIC_EXPLORER_URL: "http://127.0.0.1:8545",
    NEXT_PUBLIC_ORX_TOKEN: c.ORXToken,
    NEXT_PUBLIC_VEORX: c.veORX,
    NEXT_PUBLIC_MARKET_POSITIONS: c.MarketPositions,
    NEXT_PUBLIC_PREDICTION_AMM: c.PredictionAMM,
    NEXT_PUBLIC_MARKET_FACTORY: c.MarketFactoryV2,
    NEXT_PUBLIC_ORACLE_ADAPTER: c.OracleAdapterV2,
    NEXT_PUBLIC_VERIFIER: c.VerifierV2,
    NEXT_PUBLIC_GOVERNANCE: c.Governance,
    NEXT_PUBLIC_TREASURY: c.Treasury,
    NEXT_PUBLIC_FEE_DISTRIBUTOR: c.FeeDistributor,
    NEXT_PUBLIC_USDC: c.USDC,
    NEXT_PUBLIC_API_URL: "http://localhost:4000",
    NEXT_PUBLIC_WS_URL: "ws://localhost:4001",
    NEXT_PUBLIC_SUBGRAPH_URL: "",
  };

  const backendProc = spawnDetached("npm", ["run", "start:backend"], { env: backendEnv });
  const frontendProc = spawnDetached("npm", ["run", "start:frontend"], { env: frontendEnv });

  const shutdown = () => {
    if (!backendProc.killed) backendProc.kill("SIGINT");
    if (!frontendProc.killed) frontendProc.kill("SIGINT");
    cleanup();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log("Local demo is ready:");
  console.log("- Frontend: http://localhost:3000");
  console.log("- Backend:  http://localhost:4000");
  console.log("Press Ctrl+C to stop all services.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
