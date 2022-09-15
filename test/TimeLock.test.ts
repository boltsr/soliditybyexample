import { Erc20Mock } from "../typechain/Erc20Mock";
import { TimeLock } from "../typechain/TimeLock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "hardhat";

import { Erc20MockFactory } from "../typechain/Erc20MockFactory";
import { TimeLockFactory } from "../typechain/TimeLockFactory";
import { advanceTimeAndBlock, getLatestBlockTimestamp } from "../utils/util";

const { expect } = chai;
chai.use(solidity);

describe("TimeLock", () => {
  let timeLock: TimeLock;
  let testToken: Erc20Mock;
  let owner: SignerWithAddress,
    bob: SignerWithAddress,
    alice: SignerWithAddress;
  const duration = 604800;
  const depositAmount = ethers.utils.parseUnits("1000", 18);
  const checkAmount = ethers.utils.parseUnits("100000", 18);

  const targetAmount = ethers.utils.parseUnits("10000", 18);

  before(async () => {
    [owner, bob, alice] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const TimeLock = <TimeLockFactory>(
      await ethers.getContractFactory("TimeLock")
    );
    const TestToken = <Erc20MockFactory>(
      await ethers.getContractFactory("ERC20Mock")
    );
    timeLock = await TimeLock.deploy();
    testToken = await TestToken.deploy();

    await testToken.mint(alice.address, targetAmount);

    await testToken.mint(bob.address, targetAmount);
    await testToken.mint(timeLock.address, targetAmount);

    await testToken
      .connect(alice)
      .approve(timeLock.address, ethers.constants.MaxUint256);
    await testToken
      .connect(bob)
      .approve(timeLock.address, ethers.constants.MaxUint256);
  });

  it("correct tx id", async () => {
    const latestTime = await getLatestBlockTimestamp();
    const txId = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "bytes", "uint256"],
        [testToken.address, depositAmount, "0x00", latestTime]
      )
    );
    const txContract = await timeLock.generateTxId(
      testToken.address,
      depositAmount,
      "0x00",
      latestTime
    );
    expect(txId).to.be.equal(txContract);
  });
  it("queue new tx", async () => {
    const latestTime = await getLatestBlockTimestamp();
    await expect(
      timeLock.queueTX(testToken.address, depositAmount, "0x00", latestTime)
    ).to.be.revertedWith("out of range");
    advanceTimeAndBlock(200);

    const txContract = await timeLock.generateTxId(
      testToken.address,
      depositAmount,
      "0x00",
      latestTime
    );
    await timeLock.queueTX(
      testToken.address,
      depositAmount,
      "0x00",
      latestTime
    );
    await expect(
      timeLock.queueTX(testToken.address, depositAmount, "0x00", latestTime)
    ).to.be.revertedWith("already queued");
    const status = await timeLock.txStatus(txContract);
    expect(status).to.be.equal(true);
  });
  it("cancel tx", async () => {
    const latestTime = await getLatestBlockTimestamp();
    advanceTimeAndBlock(200);
    const txContract = await timeLock.generateTxId(
      testToken.address,
      depositAmount,
      "0x00",
      latestTime
    );

    await expect(timeLock.cancel(txContract)).to.be.revertedWith(
      "not queued tx"
    );
    await timeLock.queueTX(
      testToken.address,
      depositAmount,
      "0x00",
      latestTime
    );
    await timeLock.cancel(txContract);
    const status = await timeLock.txStatus(txContract);
    expect(status).to.be.equal(false);
  });
  it("execute tx", async () => {
    const latestTime = await getLatestBlockTimestamp();
    advanceTimeAndBlock(200);
    const txContract = await timeLock.generateTxId(
      testToken.address,
      depositAmount,
      "0x00",
      latestTime + 100
    );
    await expect(timeLock.cancel(txContract)).to.be.revertedWith(
      "not queued tx"
    );
    let ABI = ["function transfer(address to, uint amount)"];
    let iface = new ethers.utils.Interface(ABI);
    const _data = iface.encodeFunctionData("transfer", [
      timeLock.address,
      depositAmount,
    ]);
    const _checkData = iface.encodeFunctionData("transfer", [
      timeLock.address,
      checkAmount,
    ]);
    const balance0 = await testToken.balanceOf(timeLock.address);
    await expect(
      timeLock.execute(testToken.address, checkAmount, _checkData, latestTime)
    ).to.be.revertedWith("tx failed");
    await timeLock.execute(testToken.address, 0, _data, latestTime);
    const balance1 = await testToken.balanceOf(timeLock.address);
    const status = await timeLock.txStatus(txContract);
    expect(status).to.be.equal(false);
    expect(balance1).to.be.equal(targetAmount);
  });
});
