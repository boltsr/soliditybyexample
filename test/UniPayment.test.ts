import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "hardhat";
import { UniPayment, UniPaymentFactory } from "../typechain";
import { advanceTimeAndBlock } from "../utils/util";
const { expect } = chai;
chai.use(solidity);

describe("Uni Directional Payment Channel", () => {
  let uniPayment: UniPayment;
  let hash: any, notHash: any;
  let owner: SignerWithAddress, alice: SignerWithAddress;
  const duration = 604800;
  const depositAmount = ethers.utils.parseUnits("2", 18);
  const testAmount = ethers.utils.parseUnits("3", 18);
  const transferAmount = ethers.utils.parseUnits("1", 18);
  const checkAmount = ethers.utils.parseUnits("1.9", 18);
  const transferCheckAmount = ethers.utils.parseUnits("0.9", 18);

  before(async () => {
    [owner, alice] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const UniPayment = <UniPaymentFactory>(
      await ethers.getContractFactory("UniPayment", owner)
    );
    await expect(
      UniPayment.deploy("0x0000000000000000000000000000000000000000", {
        value: depositAmount,
      })
    ).to.be.revertedWith("Receiver should not be zero address.");
    uniPayment = await UniPayment.deploy(alice.address, {
      value: depositAmount,
    });
    hash = ethers.utils.solidityKeccak256(
      ["address", "uint"],
      [uniPayment.address, transferAmount]
    );
    notHash = ethers.utils.solidityKeccak256(
      ["address", "uint"],
      [uniPayment.address, depositAmount]
    );
    const initBalance = await ethers.provider.getBalance(uniPayment.address);
    expect(initBalance).equal(depositAmount);
  });

  it("return hash with amount", async () => {
    const contractHash = await uniPayment.getHash(transferAmount);
    expect(hash).to.equal(contractHash);
    expect(notHash).not.equal(contractHash);
  });

  it("return ethMessageHash with amount", async () => {
    const ethHash = ethers.utils.solidityKeccak256(
      ["string", "bytes32"],
      ["\x19Ethereum Signed Message:\n32", hash]
    );
    const notEthHash = ethers.utils.solidityKeccak256(
      ["string", "bytes32"],
      ["\x19Ethereum Signed Message", hash]
    );
    const contractEthHash = await uniPayment.getEthSignedHash(transferAmount);
    expect(ethHash).to.equal(contractEthHash);
    expect(notEthHash).not.equal(contractEthHash);
  });
  it("verify signature", async () => {
    const messageHashBytes = ethers.utils.arrayify(hash);
    const flatSig = await owner.signMessage(messageHashBytes);
    const isVerified = await uniPayment.verify(transferAmount, flatSig);
    expect(isVerified).to.equal(true);
    const noMessageHashBytes = ethers.utils.arrayify(notHash);
    const notFlatSig = await owner.signMessage(noMessageHashBytes);
    const notVerified = await uniPayment.verify(transferAmount, notFlatSig);
    expect(notVerified).not.equal(true);
  });
  it("execute the transaction", async () => {
    const messageHashBytes = ethers.utils.arrayify(hash);
    const flatSig = await owner.signMessage(messageHashBytes);
    const noMessageHashBytes = ethers.utils.arrayify(notHash);
    const notFlatSig = await owner.signMessage(noMessageHashBytes);
    const overHash = ethers.utils.solidityKeccak256(
      ["address", "uint"],
      [uniPayment.address, ethers.utils.parseUnits("3", 18)]
    );
    const overMessageHashBytes = ethers.utils.arrayify(overHash);
    const overFlatSig = await owner.signMessage(overMessageHashBytes);
    await expect(
      uniPayment.execute(transferAmount, flatSig)
    ).to.be.revertedWith("Receiver is not correct");
    await expect(
      uniPayment.connect(alice).execute(transferAmount, notFlatSig)
    ).to.be.revertedWith("Invalid Signature!");
    await expect(
      uniPayment.connect(alice).execute(testAmount, overFlatSig)
    ).to.be.revertedWith("Tx is failed");
    const balance0 = await ethers.provider.getBalance(uniPayment.address);
    const senderBalance0 = await ethers.provider.getBalance(owner.address);
    const receiverBalance0 = await ethers.provider.getBalance(alice.address);
    expect(balance0).to.equal(depositAmount);

    await uniPayment.connect(alice).execute(transferAmount, flatSig);
    const balance1 = await ethers.provider.getBalance(uniPayment.address);
    const senderBalance1 = await ethers.provider.getBalance(owner.address);
    const receiverBalance1 = await ethers.provider.getBalance(alice.address);
    expect(balance1).to.equal(0);
    expect(senderBalance1.sub(senderBalance0)).to.gte(transferCheckAmount);
    expect(senderBalance1.sub(senderBalance0)).to.lte(transferAmount);
    expect(receiverBalance1.sub(receiverBalance0)).to.gte(transferCheckAmount);
    expect(receiverBalance1.sub(receiverBalance0)).to.lte(transferAmount);
  });
  it("cancel the transaction", async () => {
    await expect(uniPayment.connect(alice).cancel()).to.be.revertedWith(
      "Send is not valid"
    );
    await expect(uniPayment.cancel()).to.be.revertedWith(
      "ExpireTime is not over."
    );
    advanceTimeAndBlock(duration);
    const balance0 = await ethers.provider.getBalance(uniPayment.address);
    const senderBalance0 = await ethers.provider.getBalance(owner.address);
    expect(balance0).to.equal(depositAmount);

    await uniPayment.cancel();
    const balance1 = await ethers.provider.getBalance(uniPayment.address);
    const senderBalance1 = await ethers.provider.getBalance(owner.address);
    expect(balance1).to.equal(0);
    expect(senderBalance1.sub(senderBalance0)).to.gt(checkAmount);
    expect(senderBalance1.sub(senderBalance0)).to.lt(depositAmount);
  });
});
