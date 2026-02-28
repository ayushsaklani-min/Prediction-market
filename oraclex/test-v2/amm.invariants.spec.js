import { expect } from 'chai';
import hardhat from 'hardhat';

const { ethers, upgrades } = hardhat;

describe('PredictionAMM invariants and security checks', function () {
  async function deployCore() {
    const [admin, trader] = await ethers.getSigners();

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

    const FactoryMock = await ethers.getContractFactory('MockMarketFactory');
    const factoryMock = await FactoryMock.deploy();
    await factoryMock.waitForDeployment();
    await amm.setMarketFactory(await factoryMock.getAddress());

    return { admin, trader, usdc, positions, amm, factoryMock };
  }

  it('restricts market settlement to OPERATOR role', async function () {
    const { admin, trader, usdc, amm } = await deployCore();
    const marketId = ethers.keccak256(ethers.toUtf8Bytes('role-check-market'));
    await usdc.transfer(await amm.getAddress(), 2_000_000n);
    await amm.createMarket(marketId, 1_000_000n, 1_000_000n);

    await expect(amm.connect(trader).settleMarket(marketId, 1)).to.be.reverted;
    await expect(amm.connect(admin).settleMarket(marketId, 1)).to.be.revertedWith('AMM: unknown market');
  });

  it('keeps collateral accounting conserved at settlement', async function () {
    const { trader, usdc, amm, factoryMock } = await deployCore();
    const marketId = ethers.keccak256(ethers.toUtf8Bytes('conservation-market'));

    await usdc.transfer(await amm.getAddress(), 2_000_000n);
    await amm.createMarket(marketId, 1_000_000n, 1_000_000n);

    await usdc.mint(trader.address, 1_000_000n);
    await usdc.connect(trader).approve(await amm.getAddress(), 500_000n);
    await amm.connect(trader).buy(marketId, 1, 200_000n, 1n);

    const before = await amm.markets(marketId);
    const now = await ethers.provider.getBlock('latest').then((b) => b.timestamp);
    await factoryMock.setMarket(marketId, now - 3600, now - 60, false);
    await amm.settleMarket(marketId, 1);
    const afterSettle = await amm.markets(marketId);

    const collateral = before.yesPool + before.noPool;
    expect(afterSettle.winnerPayoutPool + afterSettle.lpCollateralPool).to.equal(collateral);
  });

  it('prevents over-redemption and drains winner pool proportionally', async function () {
    const { trader, usdc, positions, amm, factoryMock } = await deployCore();
    const marketId = ethers.keccak256(ethers.toUtf8Bytes('redeem-market'));

    await usdc.transfer(await amm.getAddress(), 2_000_000n);
    await amm.createMarket(marketId, 1_000_000n, 1_000_000n);

    await usdc.mint(trader.address, 1_000_000n);
    await usdc.connect(trader).approve(await amm.getAddress(), 400_000n);
    await amm.connect(trader).buy(marketId, 1, 300_000n, 1n);

    const now = await ethers.provider.getBlock('latest').then((b) => b.timestamp);
    await factoryMock.setMarket(marketId, now - 7200, now - 30, false);
    await amm.settleMarket(marketId, 1);

    const winningTokenId = ethers.toBigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint8'], [marketId, 1])));
    const shares = await positions.balanceOf(trader.address, winningTokenId);
    await amm.connect(trader).redeem(marketId, 1, shares);

    const market = await amm.markets(marketId);
    expect(market.winnerPayoutPool).to.equal(0n);
    expect(market.winningSharesRemaining).to.equal(0n);
    await expect(amm.connect(trader).redeem(marketId, 1, 1n)).to.be.revertedWith('AMM: exceeds claimable');
  });

  it('maintains complementary pricing invariant', async function () {
    const { usdc, amm } = await deployCore();
    const marketId = ethers.keccak256(ethers.toUtf8Bytes('price-invariant-market'));
    await usdc.transfer(await amm.getAddress(), 2_000_000n);
    await amm.createMarket(marketId, 1_000_000n, 1_000_000n);

    const yesPrice = await amm.getPrice(marketId, 1);
    const noPrice = await amm.getPrice(marketId, 0);
    expect(yesPrice + noPrice).to.equal(10_000n);
  });

  it('enforces slippage guard under extreme minSharesOut', async function () {
    const { trader, usdc, amm } = await deployCore();
    const marketId = ethers.keccak256(ethers.toUtf8Bytes('slippage-guard-market'));
    await usdc.transfer(await amm.getAddress(), 2_000_000n);
    await amm.createMarket(marketId, 1_000_000n, 1_000_000n);

    await usdc.mint(trader.address, 100_000n);
    await usdc.connect(trader).approve(await amm.getAddress(), 100_000n);
    await expect(amm.connect(trader).buy(marketId, 1, 50_000n, 60_000n)).to.be.revertedWith('AMM: slippage exceeded');
  });

  it('handles tiny trades without breaking pool accounting', async function () {
    const { trader, usdc, amm } = await deployCore();
    const marketId = ethers.keccak256(ethers.toUtf8Bytes('tiny-trade-market'));
    await usdc.transfer(await amm.getAddress(), 2_000_000n);
    await amm.createMarket(marketId, 1_000_000n, 1_000_000n);

    await usdc.mint(trader.address, 100n);
    await usdc.connect(trader).approve(await amm.getAddress(), 100n);
    await amm.connect(trader).buy(marketId, 1, 10n, 1n);
    const post = await amm.markets(marketId);
    expect(post.yesPool + post.noPool).to.be.greaterThan(0n);
  });

  it('remains solvent across buy/sell/redeem/LP withdrawal lifecycle', async function () {
    const { admin, trader, usdc, positions, amm, factoryMock } = await deployCore();
    const marketId = ethers.keccak256(ethers.toUtf8Bytes('solvency-lifecycle-market'));
    await usdc.transfer(await amm.getAddress(), 4_000_000n);
    await amm.createMarket(marketId, 2_000_000n, 2_000_000n);

    await usdc.mint(trader.address, 1_000_000n);
    await usdc.connect(trader).approve(await amm.getAddress(), 1_000_000n);
    await amm.connect(trader).buy(marketId, 1, 300_000n, 1n);

    const yesTokenId = ethers.toBigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint8'], [marketId, 1])));
    const acquired = await positions.balanceOf(trader.address, yesTokenId);
    await amm.connect(trader).sell(marketId, 1, acquired / 3n, 1n);

    const now = await ethers.provider.getBlock('latest').then((b) => b.timestamp);
    await factoryMock.setMarket(marketId, now - 3600, now - 30, false);
    await amm.settleMarket(marketId, 1);

    const remaining = await positions.balanceOf(trader.address, yesTokenId);
    if (remaining > 0n) {
      await amm.connect(trader).redeem(marketId, 1, remaining);
    }

    const lp = await amm.totalLpShares(marketId);
    await amm.connect(admin).removeLiquidity(marketId, lp);

    const market = await amm.markets(marketId);
    const ammBalance = await usdc.balanceOf(await amm.getAddress());
    expect(ammBalance).to.be.gte(market.winnerPayoutPool + market.lpCollateralPool);
  });
});
