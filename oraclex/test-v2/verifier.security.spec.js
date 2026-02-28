import { expect } from 'chai';
import hardhat from 'hardhat';

const { ethers, upgrades } = hardhat;

describe('VerifierV2 security defaults', function () {
  it('fails closed for unsupported ZKProof verification path', async function () {
    const [admin] = await ethers.getSigners();

    const Verifier = await ethers.getContractFactory('VerifierV2');
    const verifier = await upgrades.deployProxy(Verifier, [admin.address], { kind: 'uups' });
    await verifier.waitForDeployment();

    const marketId = ethers.keccak256(ethers.toUtf8Bytes('market-zk'));
    const commitmentHash = ethers.keccak256(ethers.toUtf8Bytes('dummy-zk-commitment'));
    const proofTypeZk = 3; // ProofType.ZKProof

    await verifier.commitAI(marketId, commitmentHash, proofTypeZk, '0x1234', '');
    const valid = await verifier.verifyOutcome(marketId, 1, '0x1234');

    expect(valid).to.equal(false);
  });
});
