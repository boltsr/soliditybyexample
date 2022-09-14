import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "hardhat";
import { EnglishAuction } from "../typechain/EnglishAuction";
import { EnglishAuctionFactory } from "../typechain/EnglishAuctionFactory";
import { TestNft } from "../typechain/TestNft";
import { TestNftFactory } from "../typechain/TestNftFactory";
import { advanceTimeAndBlock } from "../utils/util";
const { expect } = chai;
chai.use(solidity);

describe("Etherwallet", () => {
  let engAuction: EnglishAuction;
  let testNFT: TestNft;
  let owner: SignerWithAddress,
    bob: SignerWithAddress,
    alice: SignerWithAddress,
    vec: SignerWithAddress,
    dave: SignerWithAddress,
    ali: SignerWithAddress;
  const duration = 604800;
  const depositAmount = ethers.utils.parseUnits("1", 18);
  const initAmount = ethers.utils.parseUnits("0.1", 18);
  const testAmount = ethers.utils.parseUnits("0.05", 18);
  const transferAmount = ethers.utils.parseUnits("1.2", 18);
  const checkAmount = ethers.utils.parseUnits("0.9", 18);
  before(async () => {
    [owner, bob, alice, vec, dave, ali] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const TestNFT = <TestNftFactory>await ethers.getContractFactory("TestNFT");
    const EngAuction = <EnglishAuctionFactory>(
      await ethers.getContractFactory("EnglishAuction")
    );
    testNFT = await TestNFT.deploy();
    await testNFT.mintToken(alice.address);

    await testNFT.mintToken(bob.address);
    engAuction = await EngAuction.connect(alice).deploy(
      testNFT.address,
      0,
      initAmount
    );
    await testNFT.connect(alice).approve(engAuction.address, 0);
    await testNFT.connect(bob).approve(engAuction.address, 1);
  });

  it("start auction", async () => {
    await expect(engAuction.connect(bob).start()).to.be.revertedWith(
      "Caller should be a seller."
    );
    await engAuction.connect(alice).start();
    await expect(engAuction.connect(bob).start()).to.be.revertedWith(
      "already started"
    );
    const started = await engAuction.connect(alice).started();
    const nftid = await engAuction.connect(alice).nftID();
    expect(started).to.be.equal(true);
    expect(nftid).to.be.equal(0);
  });

  it("bid with higher value", async () => {
    await expect(engAuction.connect(bob).bid()).to.be.revertedWith(
      "not started"
    );
    await engAuction.connect(alice).start();
    await expect(
      engAuction.connect(bob).bid({ value: testAmount })
    ).to.be.revertedWith("should be higher");
    await engAuction.connect(bob).bid({ value: depositAmount });
    let highestBidder = await engAuction.connect(bob).highestBidder();
    let highestBid = await engAuction.connect(bob).highestBid();
    expect(highestBidder).to.be.equal(bob.address);
    expect(highestBid).to.be.equal(depositAmount);
    await engAuction.connect(bob).bid({ value: transferAmount });
    highestBidder = await engAuction.connect(bob).highestBidder();
    highestBid = await engAuction.connect(bob).highestBid();
    expect(highestBidder).to.be.equal(bob.address);
    expect(highestBid).to.be.equal(transferAmount);

    advanceTimeAndBlock(duration);
    await expect(
      engAuction.connect(bob).bid({ value: testAmount })
    ).to.be.revertedWith("already ended");
  });

  it("end auction", async () => {
    await expect(engAuction.connect(bob).end()).to.be.revertedWith(
      "not started"
    );
    await engAuction.connect(alice).start();
    await engAuction.connect(bob).bid({ value: depositAmount });
    advanceTimeAndBlock(duration - 1000);
    await expect(engAuction.connect(bob).end()).to.be.revertedWith("not ended");
    advanceTimeAndBlock(1000);
    await engAuction.connect(bob).end();
    await expect(engAuction.connect(bob).end()).to.be.revertedWith("ended");
    const ended = await engAuction.ended();
    expect(ended).to.be.equal(true);
  });

  it("end auction without bid", async () => {
    await expect(engAuction.connect(bob).end()).to.be.revertedWith(
      "not started"
    );
    await engAuction.connect(alice).start();
    advanceTimeAndBlock(duration - 1000);
    await expect(engAuction.connect(bob).end()).to.be.revertedWith("not ended");
    advanceTimeAndBlock(1000);
    await engAuction.connect(bob).end();
    await expect(engAuction.connect(bob).end()).to.be.revertedWith("ended");
    const ended = await engAuction.ended();
    const balance0 = await testNFT.balanceOf(engAuction.address);
    const balance1 = await testNFT.balanceOf(bob.address);
    expect(balance0).to.be.equal(0);
    expect(balance1).to.be.equal(1);
    expect(ended).to.be.equal(true);
  });

  it("withdraw", async () => {
    await engAuction.connect(alice).start();
    const balance0 = await ethers.provider.getBalance(bob.address);
    await engAuction.connect(bob).bid({ value: depositAmount });
    await engAuction.connect(bob).withdraw();
    const balance1 = await ethers.provider.getBalance(bob.address);
    expect(balance0.sub(balance1)).to.gte(depositAmount);
  });
});
