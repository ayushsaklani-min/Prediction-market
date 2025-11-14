# Render Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Repository Structure
- [x] `artifacts/` folder exists and is committed
- [x] `deployed.json` exists and is committed
- [x] `package.json` and `package-lock.json` are committed
- [x] `backend/ai_proxy.js` exists (JavaScript, no Python needed)
- [x] `render.yaml` has correct `rootDir: oraclex`

### 2. Configuration Files
- [x] `render.yaml` configured correctly
- [x] `.nvmrc` specifies Node 18
- [x] `package.json` has `engines.node >= 18.0.0`
- [x] `.gitignore` allows artifacts to be committed

### 3. Code Quality
- [x] No hardcoded localhost URLs
- [x] All paths use `process.cwd()` (works on Render)
- [x] Error handling in place
- [x] No Python dependencies

### 4. Dependencies
- [x] All backend dependencies in `package.json`
- [x] `package-lock.json` is committed
- [x] No missing imports

## 🚀 Render Configuration

### Settings in Render Dashboard:
- **Root Directory**: `oraclex`
- **Build Command**: `npm ci`
- **Start Command**: `npm run start:backend`
- **Node Version**: 18 (auto-detected)

### Required Environment Variables:
```
PRIVATE_KEY=0x... (your private key)
RPC_URL=https://rpc-amoy.polygon.technology
USDC_ADDRESS=0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582
NODE_ENV=production
```

### Optional Environment Variables:
```
BACKEND_PORT=4000 (Render sets PORT automatically)
WS_PORT=4001
ENABLE_WS=true (if you want WebSocket in production)
```

## ✅ What Will Work on Render

1. ✅ Server starts on `process.env.PORT` (Render sets this)
2. ✅ Artifacts loaded from `artifacts/contracts/` folder
3. ✅ `deployed.json` loaded from root directory
4. ✅ AI proxy runs via Node.js (no Python needed)
5. ✅ All contract interactions work
6. ✅ Health check at `/health` endpoint

## ⚠️ Known Limitations (Free Tier)

- Services spin down after 15 min inactivity
- First request after spin-down takes 30-60 seconds
- WebSocket support is limited (frontend falls back to polling)

## 🎯 Deployment Steps

1. Push all changes to GitHub
2. Create Web Service in Render
3. Connect GitHub repository
4. Set root directory: `oraclex`
5. Add environment variables
6. Deploy and monitor logs

