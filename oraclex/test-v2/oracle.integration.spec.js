import { expect } from 'chai';
import hardhat from 'hardhat';

const { ethers, upgrades } = hardhat;

describe('Oracle settlement integration flow', function () {
  async function deployStack() {
    const [admin, challenger] = await ethers.getSigners();

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

    const Factory = await ethers.getContractFactory('MarketFactoryV2');
    const factory = await upgrades.deployProxy(
      Factory,
      [
        await usdc.getAddress(),
        await amm.getAddress(),
        admin.address,
        0n, // creation fee
        1_000_000n, // minimum initial liquidity
        admin.address,
      ],
      { kind: 'uups' }
    );
    await factory.waitForDeployment();

    const Verifier = await ethers.getContractFactory('VerifierV2');
    const verifier = await upgrades.deployProxy(Verifier, [admin.address], { kind: 'uups' });
    await verifier.waitForDeployment();

    const Oracle = await ethers.getContractFactory('OracleAdapterV2');
    const oracle = await upgrades.deployProxy(
      Oracle,
      [await amm.getAddress(), await verifier.getAddress(), ethers.parseEther('1'), admin.address],
      { kind: 'uups' }
    );
    await oracle.waitForDeployment();

    const minterRole = await positions.MINTER_ROLE();
    await positions.grantRole(minterRole, await amm.getAddress());
    const operatorRole = await amm.OPERATOR_ROLE();
    await amm.grantRole(operatorRole, await factory.getAddress());
    await amm.grantRole(operatorRole, await oracle.getAddress());
    await amm.setMarketFactory(await factory.getAddress());
    await oracle.setMarketFactory(await factory.getAddress());

    return { admin, challenger, usdc, amm, factory, verifier, oracle };
  }

  async function createMarket(factory, usdc, admin) {
    const now = await ethers.provider.getBlock('latest').then((b) => b.timestamp);
    const closeTimestamp = BigInt(now + 10);
    const resolutionTimestamp = BigInt(now + 20);
    const initialYes = 1_000_000n;
    const initialNo = 1_000_000n;
    const totalLiquidity = initialYes + initialNo;

    await usdc.connect(admin).approve(await factory.getAddress(), totalLiquidity);
    const tx = await factory.createMarket(
      'oracle-integration-event',
      'Will oracle integration test settle correctly?',
      0,
      ['integration', 'oracle'],
      closeTimestamp,
      resolutionTimestamp,
      initialYes,
      initialNo
    );
    const rc = await tx.wait();
    const iface = factory.interface;
    let marketId = null;
    for (const log of rc.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === 'MarketCreated') {
          marketId = parsed.args[0];
          break;
        }
      } catch (_) {}
    }
    expect(marketId).to.not.equal(null);

    await ethers.provider.send('evm_increaseTime', [11]);
    await ethers.provider.send('evm_mine');
    await factory.closeMarket(marketId);
    await ethers.provider.send('evm_increaseTime', [10]);
    await ethers.provider.send('evm_mine');

    return marketId;
  }

  it('commit -> propose -> finalize -> settle', async function () {
    const { factory, usdc, admin, verifier, oracle, amm } = await deployStack();
    const marketId = await createMarket(factory, usdc, admin);

    const proof = ethers.toUtf8Bytes('proof-finalize-flow');
    const commitmentHash = ethers.keccak256(ethers.solidityPacked(['uint8', 'bytes'], [1, proof]));
    await verifier.commitAI(marketId, commitmentHash, 1, proof, 'cid:finalize');

    await oracle.proposeOutcome(marketId, 1, proof);
    await ethers.provider.send('evm_increaseTime', [24 * 60 * 60 + 1]);
    await ethers.provider.send('evm_mine');
    await oracle.finalizeOutcome(marketId);

    const market = await amm.markets(marketId);
    expect(market.settled).to.equal(true);
    expect(market.winningSide).to.equal(1);
  });

  it('commit -> propose -> challenge -> resolve -> settle', async function () {
    const { factory, usdc, admin, challenger, verifier, oracle, amm } = await deployStack();
    const marketId = await createMarket(factory, usdc, admin);

    const proof = ethers.toUtf8Bytes('proof-challenge-flow');
    const commitmentHash = ethers.keccak256(ethers.solidityPacked(['uint8', 'bytes'], [1, proof]));
    await verifier.commitAI(marketId, commitmentHash, 1, proof, 'cid:challenge');

    await oracle.proposeOutcome(marketId, 1, proof);
    await oracle.connect(challenger).challengeOutcome(marketId, 0, { value: ethers.parseEther('1') });
    await oracle.resolveDispute(marketId, false, 1);

    const market = await amm.markets(marketId);
    expect(market.settled).to.equal(true);
    expect(market.winningSide).to.equal(1);
  });
});
