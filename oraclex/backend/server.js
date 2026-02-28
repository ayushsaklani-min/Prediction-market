import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { WebSocketServer } from 'ws';
import { ethers } from 'ethers';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Filter from 'bad-words';

// Load environment variables BEFORE importing supabase
dotenv.config();
import * as supabaseDb from './supabase.js';

const app = express();
app.use(express.json({ limit: '100kb' })); // Limit request size
const isProduction = process.env.NODE_ENV === 'production';
const defaultDevOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProduction && configuredOrigins.length === 0) {
  throw new Error('CORS_ORIGIN must be set in production.');
}

const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : defaultDevOrigins;
app.use(cors({
  origin(origin, callback) {
    // Allow non-browser clients (no origin) and explicitly configured web origins.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  }
}));

// Rate limiting for market creation (5 requests per 15 minutes per IP)
const createMarketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many market creation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: 'Too many admin requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Render sets PORT automatically, fallback to BACKEND_PORT or 4000
const PORT = process.env.PORT || process.env.BACKEND_PORT || 4000;
const WSP = process.env.WS_PORT || 4001;
const root = process.cwd();
const auditLogPath = path.join(root, 'backend', 'audit.log');

const deployedV2Path = path.join(root, 'deployed-v2.json');
const deployedLegacyPath = path.join(root, 'deployed.json');
let deployed = null;
if (fs.existsSync(deployedV2Path)) {
  deployed = JSON.parse(fs.readFileSync(deployedV2Path, 'utf8'));
} else if (fs.existsSync(deployedLegacyPath)) {
  deployed = JSON.parse(fs.readFileSync(deployedLegacyPath, 'utf8'));
}

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY, provider) : null;

if (!process.env.RPC_URL) {
  console.warn('RPC_URL is not set. On-chain endpoints will fail until RPC_URL is configured.');
}

if (!wallet) {
  console.warn('PRIVATE_KEY is not set. Admin and settlement operations requiring signer access are disabled.');
}

function findArtifactPath(name) {
  const hhV2Root = path.join(root, 'artifacts-v2', 'contracts-v2');
  const hhRoot = path.join(root, 'artifacts', 'contracts');
  const fdy = path.join(root, 'out', `${name}.sol`, `${name}.json`);
  if (fs.existsSync(fdy)) return fdy;
  const roots = [hhV2Root, hhRoot].filter((p) => fs.existsSync(p));
  if (roots.length === 0) return null;
  const stack = [...roots];
  while (stack.length) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && e.name === `${name}.json`) return p;
    }
  }
  return null;
}

function loadArtifact(name) {
  const p = findArtifactPath(name);
  if (!p) throw new Error(`Artifact for ${name} not found. Run: npx hardhat compile`);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  return j;
}

const artifacts = {};
['MarketFactoryV2', 'VerifierV2', 'PredictionAMM', 'OracleAdapterV2'].forEach(n => {
  try { artifacts[n] = loadArtifact(n); } catch (e) { /* ignore until built */ }
});

// Standard ERC20 ABI for USDC
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

function getContract(name, address) {
  const a = artifacts[name] || loadArtifact(name);
  return new ethers.Contract(address, a.abi, wallet || provider);
}

function getDeployedContracts() {
  if (!deployed) {
    if (fs.existsSync(deployedV2Path)) {
      deployed = JSON.parse(fs.readFileSync(deployedV2Path, 'utf8'));
    } else if (fs.existsSync(deployedLegacyPath)) {
      deployed = JSON.parse(fs.readFileSync(deployedLegacyPath, 'utf8'));
    } else {
      return {};
    }
  }
  return deployed.contracts || deployed;
}

function getUSDCContract(address) {
  return new ethers.Contract(address, ERC20_ABI, wallet || provider);
}

// Content moderation filter
const profanityFilter = new Filter();
profanityFilter.addWords('spam', 'scam'); // Add custom words if needed

// Legacy in-memory fallback (only used if Supabase not configured)
const markets = new Map(); // marketId => { eventId, description, closeTimestamp, vault, probability }

function broadcast(msg) {
  const data = JSON.stringify(msg);
  if (wss) {
    wss.clients.forEach(c => { 
      try { 
        if (c.readyState === 1) { // WebSocket.OPEN
          c.send(data); 
        }
      } catch (e) {
        // Silently handle closed connections
      }
    });
  }
}

function hasAdminAccess(req) {
  if (!process.env.ADMIN_API_KEY) return false;
  return req.headers['x-api-key'] === process.env.ADMIN_API_KEY;
}

function appendAuditLog(entry) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n';
  try {
    fs.appendFileSync(auditLogPath, line);
  } catch (err) {
    console.warn('Failed to write audit log:', err?.message || err);
  }
}

function logAdminAction(req, action, status, details = {}) {
  appendAuditLog({
    action,
    status,
    ip: req.ip,
    path: req.path,
    userAgent: req.headers['user-agent'] || '',
    details,
  });
}

const usedCreateMarketNonces = new Map();
const MAX_SIGNATURE_TTL_SECONDS = 15 * 60;

function buildCreateMarketMessage({
  creatorAddress,
  eventId,
  description,
  closeTimestamp,
  chainId,
  nonce,
  expiresAt,
}) {
  return [
    'OracleX Create Market Authorization',
    `creator=${String(creatorAddress).toLowerCase()}`,
    `eventId=${eventId}`,
    `description=${description}`,
    `closeTimestamp=${closeTimestamp}`,
    `chainId=${chainId}`,
    `nonce=${nonce}`,
    `expiresAt=${expiresAt}`,
  ].join('\n');
}

function isCreateMarketNonceUsed(address, nonce) {
  const lower = String(address).toLowerCase();
  const nonceSet = usedCreateMarketNonces.get(lower);
  return nonceSet ? nonceSet.has(nonce) : false;
}

function markCreateMarketNonceUsed(address, nonce, expiresAt) {
  const lower = String(address).toLowerCase();
  const nonceSet = usedCreateMarketNonces.get(lower) || new Set();
  nonceSet.add(nonce);
  usedCreateMarketNonces.set(lower, nonceSet);

  const ttlMs = Math.max(0, (Number(expiresAt) - Math.floor(Date.now() / 1000)) * 1000);
  setTimeout(() => {
    const setRef = usedCreateMarketNonces.get(lower);
    if (!setRef) return;
    setRef.delete(nonce);
    if (setRef.size === 0) usedCreateMarketNonces.delete(lower);
  }, ttlMs);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      rpcConfigured: Boolean(process.env.RPC_URL),
      signerConfigured: Boolean(wallet),
      adminKeyConfigured: Boolean(process.env.ADMIN_API_KEY),
      supabaseConfigured: Boolean(supabaseDb.supabase),
    },
  });
});

app.get('/addresses', (req, res) => {
  try {
    if (!deployed && fs.existsSync(deployedV2Path)) deployed = JSON.parse(fs.readFileSync(deployedV2Path, 'utf8'));
    if (!deployed && fs.existsSync(deployedLegacyPath)) deployed = JSON.parse(fs.readFileSync(deployedLegacyPath, 'utf8'));
    res.json(deployed || {});
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/abi/:name', (req, res) => {
  try {
    const name = req.params.name;
    if (name === 'USDC') {
      // Return standard ERC20 ABI for USDC
      res.json({ abi: ERC20_ABI });
    } else {
      const art = loadArtifact(name);
      res.json({ abi: art.abi });
    }
  } catch (e) {
    res.status(404).json({ error: 'ABI not found' });
  }
});

app.get('/markets', async (req, res) => {
  try {
    if (supabaseDb.supabase) {
      // Use Supabase
      const dbMarkets = await supabaseDb.getAllMarkets();
      const formatted = dbMarkets.map(m => ({
        marketId: m.market_id,
        eventId: m.event_id,
        description: m.description,
        closeTimestamp: m.close_timestamp,
        vault: m.vault_address,
        probability: m.probability,
        creatorAddress: m.creator_address,
        createdAt: m.created_at,
        deployedAt: m.deployed_at,
      }));
      return res.json(formatted);
    } else {
      // Fallback to in-memory
      const all = Array.from(markets.entries()).map(([marketId, m]) => ({ marketId, ...m }));
      res.json(all);
    }
  } catch (error) {
    console.error('Error fetching markets:', error);
    // Fallback to in-memory on error
    const all = Array.from(markets.entries()).map(([marketId, m]) => ({ marketId, ...m }));
    res.json(all);
  }
});

// Input validation helper
function validateMarketInput(eventId, description, closeTimestamp) {
  const errors = [];
  
  // Event ID validation
  if (!eventId || typeof eventId !== 'string') {
    errors.push('Event ID is required and must be a string');
  } else {
    const trimmed = eventId.trim();
    if (trimmed.length === 0) {
      errors.push('Event ID cannot be empty');
    } else if (trimmed.length > 100) {
      errors.push('Event ID must be 100 characters or less');
    } else if (!/^[a-zA-Z0-9\-_ ]+$/.test(trimmed)) {
      errors.push('Event ID can only contain letters, numbers, spaces, hyphens, and underscores');
    }
  }
  
  // Description validation
  if (!description || typeof description !== 'string') {
    errors.push('Description is required and must be a string');
  } else {
    const trimmed = description.trim();
    if (trimmed.length === 0) {
      errors.push('Description cannot be empty');
    } else if (trimmed.length > 500) {
      errors.push('Description must be 500 characters or less');
    }
  }
  
  // Close timestamp validation
  if (!closeTimestamp || typeof closeTimestamp !== 'number') {
    errors.push('Close timestamp is required and must be a number');
  } else {
    const now = Math.floor(Date.now() / 1000);
    const maxFuture = now + (365 * 24 * 60 * 60); // 1 year from now
    
    if (closeTimestamp < now) {
      errors.push('Close timestamp cannot be in the past');
    } else if (closeTimestamp > maxFuture) {
      errors.push('Close timestamp cannot be more than 1 year in the future');
    }
  }
  
  return errors;
}

// Sanitize string inputs (remove potential XSS)
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 500); // Enforce max length
}

// Content moderation check
function checkContentModeration(text) {
  if (!text || typeof text !== 'string') return { allowed: true };
  
  const isProfane = profanityFilter.isProfane(text);
  if (isProfane) {
    return { 
      allowed: false, 
      reason: 'Content contains inappropriate language. Please use professional language.' 
    };
  }
  
  // Check for spam patterns
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters (e.g., "aaaaaaaaaaa")
    /(.){1,3}\s*(.){1,3}\s*(.){1,3}\s*(.){1,3}\s*(.){1,3}/, // Random character spam
  ];
  
  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      return { 
        allowed: false, 
        reason: 'Content appears to be spam. Please provide a meaningful description.' 
      };
    }
  }
  
  return { allowed: true };
}

// Verify wallet signature
async function verifyWalletSignature(address, message, signature) {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

app.post('/create-market', createMarketLimiter, async (req, res) => {
  try {
    let {
      eventId,
      description,
      closeTimestamp,
      creatorAddress,
      signature,
      message,
      nonce,
      expiresAt,
    } = req.body;
    const now = Math.floor(Date.now() / 1000);
    if (!creatorAddress || !signature || !nonce || !expiresAt) {
      return res.status(400).json({
        error: 'creatorAddress, signature, nonce, and expiresAt are required',
      });
    }
    if (typeof nonce !== 'string' || nonce.length < 8 || nonce.length > 128) {
      return res.status(400).json({ error: 'Invalid nonce format' });
    }
    if (typeof expiresAt !== 'number' || !Number.isFinite(expiresAt)) {
      return res.status(400).json({ error: 'expiresAt must be a unix timestamp in seconds' });
    }
    if (expiresAt <= now) {
      return res.status(400).json({ error: 'Signature expired' });
    }
    if (expiresAt > now + MAX_SIGNATURE_TTL_SECONDS) {
      return res.status(400).json({ error: 'Signature expiry too far in future' });
    }
    if (isCreateMarketNonceUsed(creatorAddress, nonce)) {
      return res.status(409).json({ error: 'Nonce already used' });
    }
    
    // Sanitize inputs
    eventId = sanitizeString(eventId);
    description = sanitizeString(description);
    
    // Content moderation
    const eventIdCheck = checkContentModeration(eventId);
    if (!eventIdCheck.allowed) {
      return res.status(400).json({ error: eventIdCheck.reason });
    }
    
    const descriptionCheck = checkContentModeration(description);
    if (!descriptionCheck.allowed) {
      return res.status(400).json({ error: descriptionCheck.reason });
    }
    
    // Validate inputs
    const validationErrors = validateMarketInput(eventId, description, closeTimestamp);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join('; ') });
    }
    
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const expectedMessage = buildCreateMarketMessage({
      creatorAddress,
      eventId,
      description,
      closeTimestamp,
      chainId,
      nonce,
      expiresAt,
    });
    if (message && message !== expectedMessage) {
      return res.status(400).json({ error: 'Signed message mismatch' });
    }
    const isValid = await verifyWalletSignature(creatorAddress, expectedMessage, signature);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid wallet signature' });
    }
    
    // Generate market ID
    const marketId = ethers.solidityPackedKeccak256(
      ['string','string','uint256','address','uint256'],
      [eventId, description, BigInt(closeTimestamp), creatorAddress, BigInt(chainId)]
    );
    
    // Check for duplicate market
    if (supabaseDb.supabase) {
      const exists = await supabaseDb.checkMarketExists(marketId);
      if (exists) {
        return res.status(409).json({ error: 'Market with these parameters already exists' });
      }
    } else {
      if (markets.has(marketId)) {
        return res.status(409).json({ error: 'Market with these parameters already exists' });
      }
    }
    
    // Store market
    if (supabaseDb.supabase) {
      await supabaseDb.createMarket({
        marketId,
        eventId,
        description,
        closeTimestamp,
        creatorAddress,
        chainId,
        vault: null,
        probability: null,
      });
    } else {
      markets.set(marketId, { eventId, description, closeTimestamp, vault: null, probability: null });
    }

    markCreateMarketNonceUsed(creatorAddress, nonce, expiresAt);
    
    broadcast({ type: 'market_created', marketId, eventId, description, closeTimestamp });
    res.json({ marketId });
  } catch (error) {
    console.error('Error creating market:', error);
    res.status(500).json({ error: 'Internal server error while creating market' });
  }
});

// Gas estimation endpoint
app.post('/estimate-gas', async (req, res) => {
  try {
    const contracts = getDeployedContracts();
    if (!contracts.MarketFactoryV2) {
      return res.status(500).json({ error: 'MarketFactoryV2 not configured in deployment file.' });
    }
    const { eventId, description, category = 5, tags = [], closeTimestamp, resolutionTimestamp, initialYes, initialNo } = req.body;
    
    if (!eventId || !description || !closeTimestamp || !resolutionTimestamp || !initialYes || !initialNo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const factory = getContract('MarketFactoryV2', contracts.MarketFactoryV2);
    const gasEstimate = await factory.createMarket.estimateGas(
      eventId,
      description,
      Number(category),
      tags,
      BigInt(closeTimestamp),
      BigInt(resolutionTimestamp),
      BigInt(initialYes),
      BigInt(initialNo)
    );
    const gasPrice = await provider.getFeeData();
    
    const estimatedCost = gasEstimate * (gasPrice.gasPrice || gasPrice.maxFeePerGas || 0n);
    const estimatedCostEth = ethers.formatEther(estimatedCost);
    
    res.json({
      gasEstimate: gasEstimate.toString(),
      gasPrice: gasPrice.gasPrice?.toString() || gasPrice.maxFeePerGas?.toString() || '0',
      estimatedCost: estimatedCost.toString(),
      estimatedCostEth,
    });
  } catch (error) {
    console.error('Error estimating gas:', error);
    res.status(500).json({ error: 'Failed to estimate gas: ' + error.message });
  }
});

app.post('/deploy-market', createMarketLimiter, adminLimiter, async (req, res) => {
  try {
    if (!hasAdminAccess(req)) {
      logAdminAction(req, 'deploy-market', 'unauthorized');
      return res.status(401).json({
        error: 'Unauthorized. Missing or invalid x-api-key for admin endpoint.',
      });
    }
    const contracts = getDeployedContracts();
    if (!contracts.MarketFactoryV2) {
      return res.status(500).json({ error: 'MarketFactoryV2 not configured in deployment file.' });
    }
    const {
      marketId,
      eventId,
      description,
      category = 5,
      tags = [],
      closeTimestamp,
      resolutionTimestamp,
      initialYes,
      initialNo
    } = req.body;
    
    // Validate inputs
    const validationErrors = validateMarketInput(eventId, description, closeTimestamp);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join('; ') });
    }
    
    // Verify market exists
    let marketExists = false;
    if (supabaseDb.supabase) {
      const market = await supabaseDb.getMarketByMarketId(marketId);
      marketExists = !!market;
    } else {
      marketExists = markets.has(marketId);
    }
    
    if (!marketExists) {
      return res.status(404).json({ error: 'Market not found. Please create the market first.' });
    }
    
    const factory = getContract('MarketFactoryV2', contracts.MarketFactoryV2);
    
    // Check if wallet has funds for gas
    if (wallet) {
      const balance = await provider.getBalance(await wallet.getAddress());
      if (balance === 0n) {
        return res.status(402).json({ error: 'Insufficient funds for gas. Please fund the deployer wallet.' });
      }
    } else {
      return res.status(500).json({ error: 'No deployer wallet configured' });
    }
    
    const tx = await factory.createMarket(
      eventId,
      description,
      Number(category),
      tags,
      BigInt(closeTimestamp),
      BigInt(resolutionTimestamp),
      BigInt(initialYes),
      BigInt(initialNo)
    );
    const rc = await tx.wait();
    
    let onChainId = null;
    for (const l of rc.logs) {
      try {
        const i = new ethers.Interface(loadArtifact('MarketFactoryV2').abi);
        const parsed = i.parseLog(l);
        if (parsed && parsed.name === 'MarketCreated') {
          onChainId = parsed.args[0];
          break;
        }
      } catch (_) {}
    }
    
    if (!onChainId) {
      const errorMsg = 'Deployment succeeded but MarketCreated event was not decoded';
      if (supabaseDb.supabase) {
        await supabaseDb.updateMarket(marketId, { deploy_error: errorMsg });
      } else {
        const m = markets.get(marketId);
        if (m) {
          m.deployError = errorMsg;
        }
      }
      throw new Error(errorMsg);
    }
    
    // Successfully deployed - update market record
    if (supabaseDb.supabase) {
      await supabaseDb.updateMarket(marketId, {
        market_id: onChainId, // Update to on-chain ID
        deployed_at: new Date().toISOString(),
        deploy_error: null,
      });
    } else {
      const m = markets.get(marketId) || { eventId, description, closeTimestamp };
      markets.delete(marketId);
      markets.set(onChainId, m);
    }
    
    logAdminAction(req, 'deploy-market', 'success', { marketId: onChainId });
    broadcast({ type: 'market_deployed', marketId: onChainId });
    res.json({ marketId: onChainId });
  } catch (e) {
    console.error('Error deploying market:', e);
    // If deployment fails, mark it in database
    const { marketId } = req.body;
    if (marketId) {
      if (supabaseDb.supabase) {
        await supabaseDb.updateMarket(marketId, { deploy_error: String(e) });
      } else {
        if (markets.has(marketId)) {
          const m = markets.get(marketId);
          m.deployError = String(e);
        }
      }
    }
    res.status(500).json({ error: String(e) });
  }
});

app.post('/ai-run', adminLimiter, async (req, res) => {
  try {
    if (!hasAdminAccess(req)) {
      logAdminAction(req, 'ai-run', 'unauthorized');
      return res.status(401).json({
        error: 'Unauthorized. Missing or invalid x-api-key for admin endpoint.',
      });
    }
    const contracts = getDeployedContracts();
    if (!contracts.PredictionAMM) {
      return res.status(500).json({ error: 'PredictionAMM not configured in deployment file.' });
    }
    if (!contracts.VerifierV2) {
      return res.status(500).json({ error: 'VerifierV2 not configured in deployment file.' });
    }
    const { marketId, eventId, description, closeTimestamp } = req.body;
    if (!marketId || !eventId || !description) {
      return res.status(400).json({ error: 'Missing required fields: marketId, eventId, description' });
    }
    
    const ts = Math.floor(Date.now() / 1000);
    const chainId = await provider.getNetwork().then(n => Number(n.chainId));
    
    // Use Node.js script instead of Python for better Render compatibility
    const nodeCmd = process.execPath; // Use current Node.js executable
    const aiScript = spawn(nodeCmd, [path.join(root, 'backend', 'ai_proxy.js')]);
    
    const input = { eventId, description, timestamp: ts, chainId };
    aiScript.stdin.write(JSON.stringify(input));
    aiScript.stdin.end();
    
    let out = '';
    let errOut = '';
    aiScript.stdout.on('data', (d) => out += d.toString());
    aiScript.stderr.on('data', (d) => errOut += d.toString());
    
    aiScript.on('close', async (code) => {
      if (code !== 0) {
        console.error('AI script error:', errOut);
        return res.status(500).json({ error: `AI script failed: ${errOut || 'Unknown error'}` });
      }
      try {
        const result = JSON.parse(out);
        if (result.error) {
          return res.status(500).json({ error: result.error });
        }
        const { probability, explanation, aiHash, proof, outcome, ipfsCid } = result;
        if (typeof proof !== 'string' || !proof.startsWith('0x') || proof.length <= 2) {
          return res.status(500).json({ error: 'AI proxy returned invalid proof bytes' });
        }
        
        // Convert marketId to bytes32 if it's a string
        let marketIdBytes32 = marketId;
        if (typeof marketId === 'string' && marketId.startsWith('0x')) {
          marketIdBytes32 = marketId;
        } else if (typeof marketId === 'string') {
          marketIdBytes32 = ethers.solidityPackedKeccak256(['string'], [marketId]);
        }
        
        try {
          const verifier = getContract('VerifierV2', contracts.VerifierV2);
          const tx = await verifier.commitAI(marketIdBytes32, aiHash, 1, proof, ipfsCid || '');
          await tx.wait();
        } catch (chainErr) {
          // Non-fatal: commitment submission requires VERIFIER_ROLE.
          console.warn('AI commitment not submitted on-chain:', chainErr?.message || chainErr);
        }
        
        const m = markets.get(marketId) || markets.get(marketIdBytes32) || { eventId, description, closeTimestamp };
        m.probability = probability;
        m.proof = proof;
        m.aiHash = aiHash;
        m.outcome = outcome;
        m.ipfsCid = ipfsCid || null;
        markets.set(marketId, m);
        markets.set(marketIdBytes32, m);

        // Persist AI output for analytics when market exists in Supabase.
        if (supabaseDb.supabase) {
          try {
            await supabaseDb.updateMarket(marketIdBytes32, {
              probability,
              outcome,
              ai_hash: aiHash,
              proof,
              proof_hash: ethers.keccak256(proof),
              proof_cid: ipfsCid || null,
            });
          } catch (_) {
            // Non-fatal: some markets may only exist in memory during local flows.
          }
        }
        
        logAdminAction(req, 'ai-run', 'success', { marketId: marketIdBytes32, aiHash, outcome });
        broadcast({ type: 'ai_committed', marketId, probability, explanation, aiHash, proof, outcome, ipfsCid: ipfsCid || null });
        res.json({ probability, explanation, aiHash, proof, outcome, ipfsCid: ipfsCid || null });
      } catch (parseErr) {
        console.error('Failed to parse AI output:', parseErr, 'Output:', out);
        res.status(500).json({ error: `Failed to parse AI output: ${String(parseErr)}` });
      }
    });
    
    aiScript.on('error', (err) => {
      console.error('Failed to start AI script:', err);
      res.status(500).json({ error: `AI script error: ${err.message}` });
    });
  } catch (e) {
    console.error('AI Run endpoint error:', e);
    res.status(500).json({ error: String(e) });
  }
});

app.post('/allocate', async (req, res) => {
  res.status(410).json({ error: 'Deprecated in V2. Initial liquidity is supplied during createMarket.' });
});

// Oracle attestation settlement endpoint
app.post('/settle-market', adminLimiter, async (req, res) => {
  try {
    if (process.env.ENABLE_DIRECT_SETTLEMENT !== 'true') {
      return res.status(403).json({
        error: 'Direct backend settlement is disabled. Use OracleAdapterV2 propose/finalize flow on-chain.',
      });
    }

    if (!hasAdminAccess(req)) {
      logAdminAction(req, 'settle-market', 'unauthorized');
      return res.status(401).json({
        error: 'Unauthorized. Missing or invalid x-api-key for admin endpoint.',
      });
    }
    const contracts = getDeployedContracts();
    const { marketId, winningSide, proof } = req.body;
    if (!marketId || winningSide === undefined || !proof) {
      return res.status(400).json({ error: 'marketId, winningSide, and proof are required' });
    }
    if (typeof proof !== 'string' || !proof.startsWith('0x') || proof.length <= 2) {
      return res.status(400).json({ error: 'proof must be non-empty 0x-prefixed bytes' });
    }
    
    if (!wallet) {
      return res.status(500).json({ error: 'Backend wallet not configured. Set PRIVATE_KEY in .env' });
    }
    
    const marketIdBytes32 = marketId;
    if (typeof marketIdBytes32 !== 'string' || !marketIdBytes32.startsWith('0x') || marketIdBytes32.length !== 66) {
      return res.status(400).json({ error: 'Invalid marketId format. Expected 0x-prefixed hex string of 66 characters.' });
    }
    
    const winningSideNum = Number(winningSide);
    if (winningSideNum !== 0 && winningSideNum !== 1) {
      return res.status(400).json({ error: 'winningSide must be 0 (NO) or 1 (YES)' });
    }
    
    if (!contracts.OracleAdapterV2) {
      return res.status(500).json({ error: 'OracleAdapterV2 not configured in deployment file.' });
    }
    console.log('Proposing settlement with marketId:', marketIdBytes32, 'winningSide:', winningSideNum);
    const oracle = getContract('OracleAdapterV2', contracts.OracleAdapterV2);
    
    try {
    const tx = await oracle.proposeOutcome(marketIdBytes32, winningSideNum, proof);
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);
      
      logAdminAction(req, 'settle-market', 'success', { marketId: marketIdBytes32, winningSide: winningSideNum, txHash: tx.hash });
      broadcast({ type: 'outcome_proposed', marketId: marketIdBytes32, winningSide: winningSideNum });
      res.json({ ok: true, txHash: tx.hash });
    } catch (txError) {
      // If the outcome already exists, return a clearer message.
      if (txError.reason && (txError.reason.includes('outcome exists') || txError.reason.includes('already'))) {
        return res.status(400).json({ 
          error: 'Outcome already proposed or market already finalized',
          alreadyProcessed: true
        });
      }
      throw txError; // Re-throw other errors
    }
  } catch (e) {
    console.error('Settle market endpoint error:', e);
    const errorMsg = e.reason || e.message || String(e);
    logAdminAction(req, 'settle-market', 'error', { error: errorMsg });
    res.status(500).json({ error: errorMsg, details: e.toString() });
  }
});

// Faucet endpoint removed - users must obtain USDC from supported on-chain sources

app.post('/deposit', async (req, res) => {
  res.status(410).json({ error: 'Deprecated in V2. Use PredictionAMM.buy/sell from the frontend.' });
});

app.get('/get-commitment/:marketId', async (req, res) => {
  try {
    const contracts = getDeployedContracts();
    if (!contracts.VerifierV2) {
      return res.status(500).json({ error: 'VerifierV2 not configured in deployment file.' });
    }
    const marketId = req.params.marketId;
    const verifier = getContract('VerifierV2', contracts.VerifierV2);
    const commitment = await verifier.getCommitment(marketId);
    res.json({
      marketId,
      commitmentHash: commitment[0],
      proofType: Number(commitment[1]),
      submitter: commitment[2],
      timestamp: commitment[3].toString(),
      ipfsCid: commitment[4],
      verified: commitment[5],
    });
  } catch (e) {
    logAdminAction(req, 'deploy-market', 'error', { error: String(e) });
    res.status(500).json({ error: String(e) });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// WebSocket server - only start if not in production (Render free tier doesn't support WS well)
// In production, consider using a separate WebSocket service or polling
let wss = null;
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_WS === 'true') {
  try {
    wss = new WebSocketServer({ port: WSP });
    wss.on('listening', () => console.log(`WebSocket server on port ${WSP}`));
    wss.on('error', (err) => {
      console.warn('WebSocket server error:', err.message);
      console.warn('WebSocket features may be limited. Consider using polling or upgrade plan.');
    });
  } catch (err) {
    console.warn('Could not start WebSocket server:', err.message);
    console.warn('Real-time updates disabled. Frontend will use polling.');
  }
} else {
  console.log('WebSocket server disabled in production. Use polling for updates.');
}
