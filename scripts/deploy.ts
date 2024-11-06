import { ethers, run } from "hardhat";
import { BaseContract, BigNumber, ContractFactory } from "ethers";
import { profiles } from "./profiles";

const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
const ARBITRUM = 42161;

async function main() {
  let [owner] = await ethers.getSigners();
  let profile = profiles.polygonAmoy;

  let Token = await ethers.getContractFactory("AgoraToken");
  let Proxy = await ethers.getContractFactory("TokenProxy");
  let Admin = await ethers.getContractFactory("Admin");

  /*
  let admin = await Admin.attach(profile.admin);
   */
  let admin = await Admin.deploy();
  await admin.deployed();
  console.log(admin.address);

  /*
  let impl = await ethers.getContractAt('AgoraToken', profile.impl);
   */
  let impl = await Token.deploy(); //{ gasPrice: "27000000000" }
  await impl.deployed();
  console.log(impl.address);

  let init = await impl.initializeSignature("Agora Loyalty Token", "AGL", ethers.utils.parseEther("1000000000"));
  let proxy = await Proxy.deploy(impl.address, admin.address, init);

  await proxy.deployed();
  /*
  await admin.upgrade(profile.proxy, impl.address);
  */

  let token = await Token.attach(proxy.address);
  /*
    let token = await Token.attach(profile.proxy);
   */

  await token.setLevels([{
    balance64RequiredForPrev: 0,
    balance64RequiredForNext: 2000,
    boostK: 0,
    maxLbForAga: 0,
    _reserved: 0
  }, {
    balance64RequiredForPrev: 2000,
    balance64RequiredForNext: 3500,
    boostK: 500,
    maxLbForAga: 0,
    _reserved: 0
  }, {
    balance64RequiredForPrev: 3500,
    balance64RequiredForNext: 7500,
    boostK: 800,
    maxLbForAga: 1,
    _reserved: 0
  }, {
    balance64RequiredForPrev: 7500,
    balance64RequiredForNext: 18500,
    boostK: 1200,
    maxLbForAga: 2,
    _reserved: 0
  }, {
    balance64RequiredForPrev: 18500,
    balance64RequiredForNext: 60000,
    boostK: 1500,
    maxLbForAga: 4,
    _reserved: 0
  }, {
    balance64RequiredForPrev: 60000,
    balance64RequiredForNext: "0xffffffff",
    boostK: 1800,
    maxLbForAga: 10,
    _reserved: 0
  }]);

  await token.addWhitelist("0x0000000000000000000000000000000000000000");
  await token.addWhitelist("0x65CA21a83aF05776D42F34d9d518e161E65dd293");

  await token.mint("0x65CA21a83aF05776D42F34d9d518e161E65dd293", ethers.utils.parseEther("10000"));

  await run("verify:verify", {
    address: proxy.address,
    constructorArguments: [impl.address, admin.address, init],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
