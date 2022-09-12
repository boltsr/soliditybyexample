import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "hardhat";
import { EtherWallet, EtherWalletFactory } from "../typechain";
const { expect } = chai;
chai.use(solidity);

describe("Etherwallet", () => {
  let etherWallet: EtherWallet;
  let owner: SignerWithAddress,
    bob: SignerWithAddress,
    alice: SignerWithAddress;
  const depositAmount = ethers.utils.parseUnits("1", 18);

  before(async () => {
    [owner, bob, alice] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const EtherWallet = <EtherWalletFactory>(
      await ethers.getContractFactory("EtherWallet")
    );
    etherWallet = await EtherWallet.deploy();
  });

  it("Withdraw", async () => {
    await owner.sendTransaction({
      to: etherWallet.address,
      value: depositAmount, // 1 ether
    });

    await bob.sendTransaction({
      to: etherWallet.address,
      value: depositAmount, // 1 ether
    });
    await expect(
      etherWallet.connect(bob).withdraw(depositAmount)
    ).to.be.revertedWith("Only owner can withdraw.");
    await etherWallet.withdraw(depositAmount);
    const balance = await etherWallet.getBalance();
    expect(balance).to.equal(depositAmount);
  });
});
