import { expect } from 'chai';
import hardhat from 'hardhat';

const { ethers, upgrades } = hardhat;

describe('OracleAdapterV2 and PredictionAMM hardening', function () {
  it('requires challenge stake and slashes invalid disputes', async function () {
    const [admin, disputer] = await ethers.getSigners();

    const AMMMock = await ethers.getContractFactory('MockPredictionAMM');
    const ammMock = await AMMMock.deploy();
    await ammMock.waitForDeployment();

    const FactoryMock = await ethers.getContractFactory('MockMarketFactory');
    const factoryMock = await FactoryMock.deploy();
    await factoryMock.waitForDeployment();

    const Verifier = await ethers.getContractFactory('VerifierV2');
    const verifier = await upgrades.deployProxy(Verifier, [admin.address], { kind: 'uups' });
    await verifier.waitForDeployment();

    const OracleAdapter = await ethers.getContractFactory('OracleAdapterV2');
    const adapter = await upgrades.deployProxy(
      OracleAdapter,
      [await ammMock.getAddress(), await verifier.getAddress(), ethers.parseEther('1'), admin.address],
      { kind: 'uups' }
    );
    await adapter.waitForDeployment();

    await adapter.setMarketFactory(await factoryMock.getAddress());

    const marketId = ethers.keccak256(ethers.toUtf8Bytes('dispute-market'));
    const now = await ethers.provider.getBlock('latest').then((b) => b.timestamp);
    await factoryMock.setMarket(marketId, now - 3600, now - 10, false);

    const proof = ethers.toUtf8Bytes('proof-v1');
    const commitmentHash = ethers.keccak256(ethers.solidityPacked(['uint8', 'bytes'], [1, proof]));
    await verifier.commitAI(marketId, commitmentHash, 1, proof, '');

    await expect(adapter.proposeOutcome(marketId, 1, '0x')).to.be.revertedWith('Oracle: proof required');
    await adapter.proposeOutcome(marketId, 1, proof);

    await expect(
      adapter.connect(disputer).challengeOutcome(marketId, 0, { value: ethers.parseEther('0.1') })
    ).to.be.revertedWith('Oracle: invalid stake');

    const beforeOracleBalance = await ethers.provider.getBalance(admin.address);
    const stake = ethers.parseEther('1');
    await adapter.connect(disputer).challengeOutcome(marketId, 0, { value: stake });
    await adapter.resolveDispute(marketId, false, 1);
    const afterOracleBalance = await ethers.provider.getBalance(admin.address);

    expect(afterOracleBalance).to.be.greaterThan(beforeOracleBalance);
  });

  it('blocks LP withdrawals before settlement', async function () {
    const [admin] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory('TestUSDC');
    const usdc = await USDC.deploy();
    await usdc.waitForDeployment();

    const Positions = await ethers.getContractFactory('MarketPositions');
    const positions = await upgrades.deployProxy(Positions, ['https://example.com/{id}.json', admin.address], {
      kind: 'uups',
    });
    await positions.waitForDeployment();

    const AMM = await ethers.getContractFactory('PredictionAMM');
    const amm = await upgrades.deployProxy(
      AMM,
      [await usdc.getAddress(), await positions.getAddress(), admin.address, admin.address, admin.address],
      { kind: 'uups' }
    );
    await amm.waitForDeployment();

    const minterRole = await positions.MINTER_ROLE();
    await positions.grantRole(minterRole, await amm.getAddress());

    const marketId = ethers.keccak256(ethers.toUtf8Bytes('lp-guard-market'));
    const initialYes = 1_000_000n;
    const initialNo = 1_000_000n;
    await usdc.transfer(await amm.getAddress(), initialYes + initialNo);
    await amm.createMarket(marketId, initialYes, initialNo);

    const shares = await amm.totalLpShares(marketId);
    await expect(amm.removeLiquidity(marketId, shares / 2n)).to.be.revertedWith('AMM: settle first');
  });

  it('enforces per-market proof type policy', async function () {
    const [admin] = await ethers.getSigners();

    const AMMMock = await ethers.getContractFactory('MockPredictionAMM');
    const ammMock = await AMMMock.deploy();
    await ammMock.waitForDeployment();

    const FactoryMock = await ethers.getContractFactory('MockMarketFactory');
    const factoryMock = await FactoryMock.deploy();
    await factoryMock.waitForDeployment();

    const Verifier = await ethers.getContractFactory('VerifierV2');
    const verifier = await upgrades.deployProxy(Verifier, [admin.address], { kind: 'uups' });
    await verifier.waitForDeployment();

    const OracleAdapter = await ethers.getContractFactory('OracleAdapterV2');
    const adapter = await upgrades.deployProxy(
      OracleAdapter,
      [await ammMock.getAddress(), await verifier.getAddress(), ethers.parseEther('1'), admin.address],
      { kind: 'uups' }
    );
    await adapter.waitForDeployment();
    await adapter.setMarketFactory(await factoryMock.getAddress());

    const marketId = ethers.keccak256(ethers.toUtf8Bytes('policy-market'));
    const now = await ethers.provider.getBlock('latest').then((b) => b.timestamp);
    await factoryMock.setMarket(marketId, now - 3600, now - 10, false);

    const sigProof = '0x1234';
    const fakeSignatureCommitment = ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint8'], [marketId, 1]));
    await verifier.commitAI(marketId, fakeSignatureCommitment, 2, sigProof, '');

    await adapter.setMarketProofPolicy(marketId, 1 << 1); // Hash only
    await expect(adapter.proposeOutcome(marketId, 1, sigProof)).to.be.revertedWith('Oracle: proof type not allowed');
  });
});
