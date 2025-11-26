const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("ORXToken", function () {
  let orxToken;
  let owner, minter, user1, user2;

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();

    const ORXToken = await ethers.getContractFactory("ORXToken");
    orxToken = await upgrades.deployProxy(ORXToken, [owner.address], {
      initializer: "initialize",
      kind: "uups"
    });
    await orxToken.waitForDeployment();

    // Grant minter role
    const MINTER_ROLE = await orxToken.MINTER_ROLE();
    await orxToken.grantRole(MINTER_ROLE, minter.address);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await orxToken.name()).to.equal("OracleX Token");
      expect(await orxToken.symbol()).to.equal("ORX");
    });

    it("Should set the correct max supply", async function () {
      expect(await orxToken.MAX_SUPPLY()).to.equal(ethers.parseEther("1000000000"));
    });

    it("Should grant admin role to owner", async function () {
      const DEFAULT_ADMIN_ROLE = await orxToken.DEFAULT_ADMIN_ROLE();
      expect(await orxToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const amount = ethers.parseEther("1000");
      await orxToken.connect(minter).mint(user1.address, amount);
      expect(await orxToken.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should not allow non-minter to mint", async function () {
      const amount = ethers.parseEther("1000");
      await expect(
        orxToken.connect(user1).mint(user2.address, amount)
      ).to.be.reverted;
    });

    it("Should not allow minting beyond max supply", async function () {
      const maxSupply = await orxToken.MAX_SUPPLY();
      await expect(
        orxToken.connect(minter).mint(user1.address, maxSupply + 1n)
      ).to.be.revertedWith("ORX: max supply exceeded");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1000");
      await orxToken.connect(minter).mint(user1.address, amount);
    });

    it("Should allow users to burn their tokens", async function () {
      const burnAmount = ethers.parseEther("100");
      await orxToken.connect(user1).burn(burnAmount);
      expect(await orxToken.balanceOf(user1.address)).to.equal(
        ethers.parseEther("900")
      );
    });
  });

  describe("Pausable", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1000");
      await orxToken.connect(minter).mint(user1.address, amount);
    });

    it("Should allow pauser to pause transfers", async function () {
      await orxToken.connect(owner).pause();
      await expect(
        orxToken.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("Should allow pauser to unpause", async function () {
      await orxToken.connect(owner).pause();
      await orxToken.connect(owner).unpause();
      await orxToken.connect(user1).transfer(user2.address, ethers.parseEther("100"));
      expect(await orxToken.balanceOf(user2.address)).to.equal(ethers.parseEther("100"));
    });
  });

  describe("Permit", function () {
    it("Should support EIP-2612 permit", async function () {
      // This is a basic check - full permit testing would require signature generation
      expect(await orxToken.DOMAIN_SEPARATOR()).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("Upgradeability", function () {
    it("Should be upgradeable by upgrader role", async function () {
      const ORXTokenV2 = await ethers.getContractFactory("ORXToken");
      const upgraded = await upgrades.upgradeProxy(orxToken.target, ORXTokenV2);
      expect(await upgraded.name()).to.equal("OracleX Token");
    });
  });
});
