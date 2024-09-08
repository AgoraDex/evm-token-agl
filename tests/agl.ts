import { loadFixture, mine, setBlockGasLimit } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect, should } from "chai";
import * as chai from "chai";
import { BigNumber, CallOverrides } from "ethers";
import { any, string } from "hardhat/internal/core/params/argumentTypes";
import { PromiseOrValue } from "../typechain-types/common";
import { ethers, network } from "hardhat";
import { keccak256 } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { configure, deploy, EMPTY_ADDRESS, ETH1, ETH100, getUsers } from "./fixtures";


describe("AGL Token", function() {
  it("1. Mint tokens, check balance", async function() {
    const { owner, user1, user2 } = await getUsers();
    const { token, levels } = await loadFixture(
      configure
    );

    await expect(token.mint(user1.address, ETH100))
      .to.emit(token,"Transfer")
      .withArgs(EMPTY_ADDRESS, user1.address, ETH100);

    await expect(await token.balanceOf(user1.address)).is.eq( ETH100,"Must be 100 10^18");

    await expect(token.connect(user1).transfer(user2.address, ETH100))
      .to.emit(token, "Transfer")
      .withArgs(user1.address, user2.address, ETH100);

    await expect(await token.balanceOf(user2.address)).is.eq( ETH100,"Now user2 must has 100 10^18");
  });

  it("2. Whitelist check", async function() {
    const { owner, user1, user2 } = await getUsers();
    const { token, levels } = await loadFixture(
      configure
    );

    await expect(token.mint(user2.address, ETH100))
      .to.emit(token,"Transfer")
      .withArgs(EMPTY_ADDRESS, user2.address, ETH100);

    await expect(token.connect(user2).transfer(user1.address, ETH100))
      .to.be.revertedWith("AgoraToken: token transfer while paused");

    await token.addWhitelist(user2.address);

    await expect(token.connect(user2).transfer(user1.address, ETH100))
      .to.emit(token, "Transfer");
  });

  it("3. Level 1", async function() {
    const { owner, user1, user2 } = await getUsers();
    const { token, levels } = await loadFixture(
      configure
    );

    let level1Req = ETH1.mul(levels[0].balance64RequiredForNext);

    let [levelBefore, boostBefore] = await token.getLevelInfo(user1.address);
    await expect(levelBefore).equals(0);
    await expect(boostBefore).equals(0);

    await expect(token.mint(user1.address, level1Req))
      .to.emit(token,"Transfer");

    let [levelAfter, boostAfter] = await token.getLevelInfo(user1.address);
    await expect(levelAfter).equals(1);
    await expect(boostAfter).equals(500);

    await expect(token.connect(user1).transfer(user2.address, level1Req))
      .to.emit(token, "Transfer");

    let [levelUser1, boostUser1] = await token.getLevelInfo(user1.address);
    let [levelUser2, boostUser2] = await token.getLevelInfo(user2.address);

    await expect(levelUser1).equals(levelBefore);
    await expect(levelUser2).equals(levelAfter);

    await expect(boostUser1).equals(boostBefore);
    await expect(boostUser2).equals(boostAfter);
  });

  it("4. Level 1->2, 0->2", async function() {
    const { owner, user1, user2 } = await getUsers();
    const { token, levels } = await loadFixture(
      configure
    );

    let level1Req = ETH1.mul(levels[0].balance64RequiredForNext);
    let level2Req = ETH1.mul(levels[1].balance64RequiredForNext);
    let level1to2 = level2Req.sub(level1Req);

    await expect(token.mint(user1.address, level1Req))
      .to.emit(token, "Transfer");

    let [level1, boost1] = await token.getLevelInfo(user1.address);
    await expect(level1).equals(1);
    await expect(boost1).equals(500);

    await expect(token.mint(user1.address, level1to2))
      .to.emit(token, "Transfer");

    let [level2, boost2] = await token.getLevelInfo(user1.address);
    await expect(level2).equals(2);
    await expect(boost2).equals(800);

    await expect(token.mint(user2.address, level2Req))
      .to.emit(token, "Transfer");

    let [level2User2, boost2User2] = await token.getLevelInfo(user2.address);
    await expect(level2User2).equals(2);
    await expect(boost2User2).equals(800);
  });

  it("5. Level - corner cases", async function() {
    const { owner, user1, user2 } = await getUsers();
    const { token, levels } = await loadFixture(
      configure
    );

    let level1Req = ETH1.mul(levels[0].balance64RequiredForNext);
    let levelAlmost1 = level1Req.sub(1);
    let level2Req = ETH1.mul(levels[1].balance64RequiredForNext);
    let levelAlmost2 = level2Req.sub(1);

    await expect(token.mint(user1.address, levelAlmost1))
      .to.emit(token, "Transfer");

    let [level0, boost0] = await token.getLevelInfo(user1.address);
    await expect(level0).equals(0);
    await expect(boost0).equals(0);

    await expect(token.mint(user1.address, 1))
      .to.emit(token, "Transfer");

    let [level1, boost1] = await token.getLevelInfo(user1.address);
    await expect(level1).equals(1);
    await expect(boost1).equals(500);

    await expect(token.mint(user2.address, levelAlmost2))
      .to.emit(token, "Transfer");

    let [level1User2, boost1User2] = await token.getLevelInfo(user2.address);
    await expect(level1User2).equals(1);
    await expect(boost1User2).equals(500);
  });
});