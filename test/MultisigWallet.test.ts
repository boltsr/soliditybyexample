import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "hardhat";
import { MultiSig, MultiSigFactory } from "../typechain";
const { expect } = chai;
chai.use(solidity);

describe("Etherwallet", () => {
  let multiWallet: MultiSig;
  let owner: SignerWithAddress,
    bob: SignerWithAddress,
    alice: SignerWithAddress,
    vec: SignerWithAddress,
    dave: SignerWithAddress,
    ali: SignerWithAddress;
  const depositAmount = ethers.utils.parseUnits("1", 18);

  before(async () => {
    [owner, bob, alice, vec, dave, ali] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const MultiWallet = <MultiSigFactory>(
      await ethers.getContractFactory("MultiSig")
    );

    multiWallet = await MultiWallet.deploy(
      [owner.address, bob.address, alice.address, vec.address, dave.address],
      3
    );
    await multiWallet
      .connect(bob)
      .submitTransaction(ali.address, depositAmount, "0x00");
    await multiWallet
      .connect(alice)
      .submitTransaction(ali.address, depositAmount, "0x00");
  });

  it("Submit new Tx", async () => {
    const txData = await multiWallet.getTransaction(0);
    expect(txData.to).to.equal(ali.address);
    expect(txData.value).to.equal(depositAmount);
    expect(txData.data).to.equal("0x00");
    expect(txData.confirms).to.equal(0);
    expect(txData.executed).to.equal(false);
  });
  it("Confirm special Tx", async () => {
    await expect(multiWallet.connect(ali).confirmTx(0)).to.be.revertedWith(
      "only owner can call this function."
    );
    await expect(multiWallet.confirmTx(3)).to.be.revertedWith("invalid tx");
    await multiWallet.connect(bob).confirmTx(0);

    await expect(multiWallet.connect(bob).confirmTx(0)).to.be.revertedWith(
      "tx already confirmed"
    );
    const txData = await multiWallet.getTransaction(0);
    expect(txData.to).to.equal(ali.address);
    expect(txData.value).to.equal(depositAmount);
    expect(txData.data).to.equal("0x00");
    expect(txData.confirms).to.equal(1);
    expect(txData.executed).to.equal(false);
  });
  it("Execute special Tx", async () => {
    await expect(multiWallet.connect(ali).executeTx(0)).to.be.revertedWith(
      "only owner can call this function."
    );
    await expect(multiWallet.executeTx(4)).to.be.revertedWith("invalid tx");
    await multiWallet.connect(bob).confirmTx(0);
    await multiWallet.connect(alice).confirmTx(0);
    await expect(multiWallet.connect(bob).executeTx(0)).to.be.revertedWith(
      "cannot execute tx"
    );
    await multiWallet.connect(dave).confirmTx(0);
    // await expect(multiWallet.connect(bob).confirmTx(0)).to.be.revertedWith(
    //   "tx already confirmed"
    // );
    await expect(multiWallet.connect(bob).executeTx(0)).to.be.revertedWith(
      "tx failed"
    );
    const txData = await multiWallet.getTransaction(0);
    expect(txData.to).to.equal(ali.address);
    expect(txData.value).to.equal(depositAmount);
    expect(txData.data).to.equal("0x00");
    expect(txData.confirms).to.equal(3);
    expect(txData.executed).to.equal(false);
  });
  it("Revoke special Tx", async () => {
    await expect(multiWallet.connect(ali).revokeTx(0)).to.be.revertedWith(
      "only owner can call this function."
    );
    await expect(multiWallet.revokeTx(3)).to.be.revertedWith("invalid tx");
    await multiWallet.connect(bob).confirmTx(0);
    await multiWallet.connect(alice).confirmTx(0);
    const txDataBefore = await multiWallet.getTransaction(0);
    expect(txDataBefore.to).to.equal(ali.address);
    expect(txDataBefore.value).to.equal(depositAmount);
    expect(txDataBefore.data).to.equal("0x00");
    expect(txDataBefore.confirms).to.equal(2);
    expect(txDataBefore.executed).to.equal(false);
    await multiWallet.connect(bob).revokeTx(0);
    const txDataAfter = await multiWallet.getTransaction(0);
    expect(txDataAfter.to).to.equal(ali.address);
    expect(txDataAfter.value).to.equal(depositAmount);
    expect(txDataAfter.data).to.equal("0x00");
    expect(txDataAfter.confirms).to.equal(1);
    expect(txDataAfter.executed).to.equal(false);
  });
});
