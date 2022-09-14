import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "hardhat";
import { get } from "https";
import { DutchAuction } from "../typechain/DutchAuction";
import { DutchAuctionFactory } from "../typechain/DutchAuctionFactory";
import { TestNft } from "../typechain/TestNft";
import { TestNftFactory } from "../typechain/TestNftFactory";
import { advanceTimeAndBlock, getLatestBlockTimestamp } from "../utils/util";
const { expect } = chai;
chai.use(solidity);

describe("Etherwallet", () => {
  let dutchAuction: DutchAuction;
  let testNFT: TestNft;
  let owner: SignerWithAddress,
    bob: SignerWithAddress,
    alice: SignerWithAddress;
  const duration = 604800;
  const depositAmount = ethers.utils.parseUnits("1", 18);
  const initAmount = ethers.utils.parseUnits("0.1", 18);
  const testAmount = ethers.utils.parseUnits("0.05", 18);
  const transferAmount = ethers.utils.parseUnits("1.2", 18);
  const checkAmount = ethers.utils.parseUnits("0.9", 18);
  before(async () => {
    [owner, bob, alice] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const TestNFT = <TestNftFactory>await ethers.getContractFactory("TestNFT");
    const DutchAuction = <DutchAuctionFactory>(
      await ethers.getContractFactory("DutchAuction")
    );
    testNFT = await TestNFT.deploy();
    await testNFT.mintToken(alice.address);

    await testNFT.mintToken(bob.address);
    const timestamp = getLatestBlockTimestamp();
    await expect(
      DutchAuction.connect(alice).deploy(
        depositAmount,
        100000000000000,
        testNFT.address,
        0
      )
    ).to.be.revertedWith("start price should be bigger.");
    dutchAuction = await DutchAuction.connect(alice).deploy(
      depositAmount,
      1,
      testNFT.address,
      0
    );
    await testNFT.connect(alice).approve(dutchAuction.address, 0);
    await testNFT.connect(bob).approve(dutchAuction.address, 1);
  });

  it("get current price", async () => {
    advanceTimeAndBlock(10000);
    const price = await dutchAuction.getPrice();
    const startPrice = await dutchAuction.startPrice();
    expect(startPrice.sub(price).toString()).to.be.gte(
      ethers.utils.parseUnits("0.0000000000000001")
    );
  });
  it("buy nft", async () => {
    const balance0 = await ethers.provider.getBalance(bob.address);
    const startPrice = await dutchAuction.startPrice();
    advanceTimeAndBlock(10000);
    const price = await dutchAuction.getPrice();
    await dutchAuction.connect(bob).buy({ value: depositAmount });
    const balance1 = await ethers.provider.getBalance(bob.address);
    const nftBalance = await testNFT.balanceOf(bob.address);
    expect(balance0.sub(balance1)).gte(startPrice.sub(price));
    expect(nftBalance).to.be.equal(2);
  });
  it("buy nft without no refund", async () => {
    const balance0 = await ethers.provider.getBalance(bob.address);
    const startPrice = await dutchAuction.startPrice();
    advanceTimeAndBlock(10000);
    const price = await dutchAuction.getPrice();
    await dutchAuction.connect(bob).buy({ value: price });
    const balance1 = await ethers.provider.getBalance(bob.address);
    const nftBalance = await testNFT.balanceOf(bob.address);
    expect(balance0.sub(balance1)).gte(startPrice.sub(price));
    expect(nftBalance).to.be.equal(2);
  });
  it("check expire time", async () => {
    advanceTimeAndBlock(duration);

    await expect(
      dutchAuction.connect(bob).buy({ value: depositAmount })
    ).to.be.revertedWith("auction ended");
  });
});
