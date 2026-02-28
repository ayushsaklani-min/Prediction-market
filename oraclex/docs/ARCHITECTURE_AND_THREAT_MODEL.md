# OracleX Architecture and Threat Model

## Architecture
- Smart contracts:
  - `MarketFactoryV2`: market creation and metadata lifecycle.
  - `PredictionAMM`: trading, liquidity, settlement redemption accounting.
  - `OracleAdapterV2`: outcome proposal/challenge/finalization path.
  - `VerifierV2`: proof verification (hash/signature live; advanced types fail-closed).
  - `SimpleGovernance` + `OracleXTimelock`: governance proposals and delayed execution.
- Backend:
  - `server.js`: admin APIs, market metadata, oracle automation glue, audit logging.
  - `ai_proxy.js`: deterministic oracle proof generation compatible with `VerifierV2`.
  - Supabase persistence for markets and proof metadata.
- Frontend:
  - Next.js + wagmi/viem.
  - On-chain reads for core state, subgraph reads for analytics/trades.
- Indexing:
  - Subgraph maps factory, AMM, oracle events on Polygon.

## Security Model
- Proof-gated settlement:
  - Outcome proposal requires non-empty proof bytes.
  - Proof must match a committed verifier hash and allowed proof policy.
- Dispute model:
  - Bonded challenge stake.
  - Resolver role finalizes disputes and settles AMM.
- Contract controls:
  - AccessControl roles on all upgradeable contracts.
  - Timelock + multisig intended as production control plane.

## Threat Model
- Oracle integrity:
  - Risk: bad oracle input/proof forgery.
  - Mitigation: verifier checks + dispute period + slashing.
- Governance capture:
  - Risk: privileged role abuse or rushed upgrades.
  - Mitigation: timelock delays, multisig role separation, emergency pause.
- Market manipulation:
  - Risk: low-liquidity price moves and slippage.
  - Mitigation: min-liquidity constraints, user-side slippage guards, monitoring.
- Backend abuse:
  - Risk: admin endpoint misuse or replayed signatures.
  - Mitigation: API keys, audit logs, rate limits, nonce+expiry signature checks.
- Data/indexing lag:
  - Risk: stale analytics or delayed UI status.
  - Mitigation: on-chain read fallback for critical state.

## Known Limitations
- `VerifierV2` advanced proof types (`ZKProof`, `ChainlinkDON`) are reserved and fail-closed.
- Proof bytes are not emitted in oracle events, so subgraph proof visibility may lag backend metadata.
- Local nonce tracking for `create-market` is in-memory; clustered deployments require shared nonce storage.
- Node runtime should be pinned to a Hardhat-supported version (Node 20/22 LTS recommended).
