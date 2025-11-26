import dotenv from 'dotenv';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import '@nomicfoundation/hardhat-verify';
import 'hardhat-contract-sizer';
import 'hardhat-gas-reporter';
import 'solidity-coverage';

dotenv.config();

const {
  PRIVATE_KEY,
  RPC_URL,
  POLYGONSCAN_API_KEY,
  COINMARKETCAP_API_KEY
} = process.env;

const config = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: false,
      evmVersion: 'cancun'
    }
  },
  
  paths: {
    sources: './contracts-v2',
    tests: './test-v2',
    cache: './cache-v2',
    artifacts: './artifacts-v2'
  },

  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: RPC_URL || 'https://polygon-rpc.com',
        enabled: process.env.FORK === 'true'
      }
    },
    
    // Polygon Amoy Testnet
    amoy: {
      url: RPC_URL || 'https://rpc-amoy.polygon.technology',
      chainId: 80002,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: 'auto',
      gas: 'auto'
    },
    
    // Polygon Mainnet
    polygon: {
      url: RPC_URL || 'https://polygon-rpc.com',
      chainId: 137,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: 'auto',
      gas: 'auto'
    },
    
    // Mumbai (deprecated but kept for reference)
    mumbai: {
      url: 'https://rpc-mumbai.maticvigil.com',
      chainId: 80001,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  },

  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY || '',
      polygonAmoy: POLYGONSCAN_API_KEY || '',
      polygonMumbai: POLYGONSCAN_API_KEY || ''
    },
    customChains: [
      {
        network: 'polygonAmoy',
        chainId: 80002,
        urls: {
          apiURL: 'https://api-amoy.polygonscan.com/api',
          browserURL: 'https://amoy.polygonscan.com'
        }
      }
    ]
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD',
    coinmarketcap: COINMARKETCAP_API_KEY,
    token: 'MATIC',
    gasPriceApi: 'https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice',
    outputFile: 'gas-report.txt',
    noColors: true
  },

  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: []
  },

  mocha: {
    timeout: 200000
  },

  docgen: {
    path: './docs/contracts',
    clear: true,
    runOnCompile: false
  }
};

export default config;
