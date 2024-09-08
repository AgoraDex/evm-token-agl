import { ethers } from "hardhat";
import { Admin, AgoraToken } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export const ETH1 = ethers.utils.parseEther("1");
export const ETH100 = ethers.utils.parseEther("100");
export const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";

interface IUsers {
  owner: SignerWithAddress,
  feePool: SignerWithAddress,
  user1: SignerWithAddress,
  user2: SignerWithAddress,
  user3: SignerWithAddress,
}

let showAccountsFlag = false;

export async function getUsers(): Promise<IUsers> {
  const [
    owner,
    user1,
    user2,
    user3
  ] = await ethers.getSigners();
  if (showAccountsFlag) {
    console.info(`Accounts: 
${owner.address} => "owner",
${user1.address} => "user1",
${user2.address} => "user2",
${user3.address} => "user3",
`);
    showAccountsFlag = false;
  }
  return { owner, user1, user2, user3 } as IUsers;
}

interface IDeployContext {
  token: AgoraToken,
  admin: Admin,
}

interface ITokenContext extends IDeployContext{
  levels: ILevel[],
}

interface ILevel {
  balance64RequiredForNext: number,
  boostK: number
}

export async function deploy() {
  let Token = await ethers.getContractFactory("AgoraToken");
  let Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
  let Admin = await ethers.getContractFactory("Admin");

  let admin = await Admin.deploy();
  let impl = await Token.deploy();
  let data = await impl.initializeSignature("Agora Loyalty", "AGL", "0xffffffffffffffffffffffffffffffffffffffffffff");
  let proxy = await Proxy.deploy(impl.address, admin.address, data);
  let token = await Token.attach(proxy.address);

  return { token, admin } as IDeployContext;
}

export async function configure() {
  let deployContext = await deploy();
  let { token } = deployContext;
  let { owner, user1 } = await getUsers();

  let levels = [{
    balance64RequiredForPrev: 0,
    balance64RequiredForNext: 2000,
    boostK: 0,
    _reserved: 0
  }, {
    balance64RequiredForPrev: 2000,
    balance64RequiredForNext: 3500,
    boostK: 500,
    _reserved: 0
  }, {
    balance64RequiredForPrev: 3500,
    balance64RequiredForNext: 7500,
    boostK: 800,
    _reserved: 0
  }, {
    balance64RequiredForPrev: 7500,
    balance64RequiredForNext: 18500,
    boostK: 1200,
    _reserved: 0
  }, {
    balance64RequiredForPrev: 18500,
    balance64RequiredForNext: "0xffffffff",
    boostK: 1500,
    _reserved: 0
  }];

  await token.setLevels(levels);

  await token.addWhitelist("0x0000000000000000000000000000000000000000");
  await token.addWhitelist(user1.address);

  return { ...deployContext, levels: levels as ILevel[] } as ITokenContext;
}