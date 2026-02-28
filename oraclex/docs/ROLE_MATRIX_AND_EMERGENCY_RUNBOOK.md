# OracleX Role Matrix and Emergency Runbook

## Role Matrix
- `DEFAULT_ADMIN_ROLE` (timelock):
  - Grants/revokes roles, parameter authority root.
- `UPGRADER_ROLE` (timelock):
  - Authorizes UUPS implementation upgrades.
- `PAUSER_ROLE` (multisig/emergency ops):
  - Pauses AMM/oracle/factory where supported.
- `ORACLE_ROLE` (oracle signer service):
  - Submits `proposeOutcome` with proof bytes.
- `DISPUTE_RESOLVER_ROLE` (multisig/governance executor):
  - Resolves disputes and finalizes challenged outcomes.
- `VERIFIER_ROLE` (oracle adapter + authorized verifier ops):
  - Commits/verifies proof material in `VerifierV2`.

## Minimum Production Setup
1. Deploy governance + timelock.
2. Assign timelock as admin/upgrader across protocol contracts.
3. Assign multisig for pause/dispute emergency powers.
4. Assign a dedicated oracle signer for `ORACLE_ROLE`.
5. Revoke deployer admin privileges.

## Emergency Procedures

### 1. Oracle anomaly or malicious outcome proposal
1. Pause oracle/AMM flows using multisig `PAUSER_ROLE`.
2. Trigger dispute on affected market(s).
3. Resolve dispute via `DISPUTE_RESOLVER_ROLE`.
4. Publish post-mortem and unpause gradually.

### 2. Critical contract vulnerability
1. Pause affected contract(s).
2. Prepare patched implementation.
3. Queue upgrade transaction through timelock.
4. Execute after delay and verify bytecode/source.
5. Resume operations once monitoring is green.

### 3. Key compromise (oracle/admin)
1. Revoke compromised role immediately.
2. Rotate to replacement key.
3. Audit affected transactions.
4. Public incident communication with timeline.

## Operational Logging
- All privileged backend endpoints append JSON lines to `backend/audit.log`.
- Archive logs daily and retain for incident forensics.
