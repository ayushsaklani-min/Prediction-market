import { spawn } from 'child_process';

// Legacy entrypoint kept for compatibility.
// For mainnet-only deployments, delegate to the maintained deploy-v2 script.
const child = spawn(
  process.execPath,
  ['node_modules/hardhat/internal/cli/cli.js', 'run', 'scripts-v2/deploy-v2.js', '--network', 'polygon', '--config', 'hardhat-v2.config.js'],
  { stdio: 'inherit' }
);

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

