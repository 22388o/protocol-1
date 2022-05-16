// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");
const envFile = "../interface/.env";
const docsFile = "../docs/deployed_address.txt";
let dataItem = "";
let fileData = "";
let docsFileData = "";
  
async function writeContractAddressesToFile(fileData, fileName) {
  fs.writeFile(fileName, fileData, (err) => {
    // In case of a error throw err.
    if (err) throw err;
  });
}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  console.log('network', network.name);

  // Ropsten
  let configuratorAddress;
  let lendingPoolAddress;
  let lendingPoolBorrowAddress;
  let lendingPoolDepositAddress;
  let lendingPoolLiquidateAddress;
  let lendingPoolBidAddress;
  let lendingPoolRedeemAddress;
  let lendingPoolRepayAddress;
  let lendingPoolWithdrawAddress;
  let collateralManagerAddress;
  let tokenPriceConsumerAddress;
  let nftPriceConsumerAddress;
  let nftBaycAddress;
  let assetTokenWethAddress;
  let ftokenBaycWethAddress;
  let debtTokenBAYCWETHAddress;

  configuratorAddress = "0x61620D2b9D852a0d5AD4ebE23d317A33a96E5DcF";
  lendingPoolAddress = "0x4741e19e5a6F0Da1205Eca9c8311174AA0152563";
  lendingPoolBorrowAddress = "0x997D0758CE7C7175Ade65f3AF43D190527cc8b71";
  lendingPoolDepositAddress = "0xF8BD83ffA68717535aC5521A05A23Ba618C3b506";
  lendingPoolLiquidateAddress = "0xF5d8d7DDC80139162486C88Cf8802838188FF040";
  lendingPoolBidAddress = "0x9e41dEb2738C552924Df97B7e505Dc99a7725779";
  lendingPoolRedeemAddress = "0xEEe9Ba60CdC68D9f8106701BF00ee9aea9d00dB1";
  lendingPoolRepayAddress = "0x2006E138C37e11993D6fe77852Ec6aCeea420111";
  lendingPoolWithdrawAddress = "0x03e4565B7d0a70F4730609c1057C149F2218013e";
  collateralManagerAddress = "0xa8410440452aC7679EAd842C71737f362E0A3B99";
  tokenPriceConsumerAddress = "0xa45600E5BDF98bF0FDC2375e5115a4518076bA9e";
  nftPriceConsumerAddress = "0x5f947EB6da61d279d2d6831EA2CE3686003d83Ab";
  nftBaycAddress = "0x006F3df6Cbe60244ec0DAdF8864e5e75A89e0CA2";
  
  console.log('here');

  // Get Signers
  [acc0, acc1, acc2, emergencyAdmin, admin, treasuryAccount] = await hre.ethers.getSigners();
 
  console.log('here2');

  let NFT;
  let nftBAYC;
  NFT = await hre.ethers.getContractFactory('NFT');
  nftBAYC = NFT.attach(nftBaycAddress);

  console.log('here3');

  // await nftBAYC.connect(acc0).approve(acc0.address, 1);
  // await nftBAYC.connect(acc0).transferFrom(acc0.address, acc1.address, 1).then(res=>{
  //   console.log('succ\n', res);
  // }).catch(error=>{
  //     console.log(ethers.utils.toUtf8String(Object.values(error.body)));
  // });;

  // await nftBAYC.connect(acc0).approve(acc0.address, 2);
  // await nftBAYC.connect(acc0).transferFrom(acc0.address, address, 2);

  const accDict = {
    0: '0x3491b165B4D38d70D2C66a560248E729066d4cB8',
    1: '0x8499411Bff99ddE9A02903008F917EEa0E27B42A',
    2: '0xd558d1eF28f3B7958F7B6E3E09f62590aB274760',
    3: '0x4481202da0130aec140d5cff7d07c84bdac80df1',
    4: '0x441C3573cF340AddE9fed3dB784E196f3Acf5212',
    5: '0x7DC35B473b6fF652C1c437996244A8d14d026252',
    6: '0x323794C012DF58d68843D745c75eA536D870c7DA',
    7: '0x3111327edd38890c3fe564afd96b4c73e8101747',
    8: '0xCf50fB42926b255747fb8b0EA8E26D4e66952CA4',
    9: '0x2ed1464e4b3823ea25605044d98339683373a223',
    10: '0x1E61E3048FeB9c6Af092f3F27105BaEaA5C2049a',
    11: '0x849a461A6d41F8C7d5ab609D1C17D329fD25698F', 
    12: '0x273f4FCa831A7e154f8f979e1B06F4491Eb508B6', 
    13: '0x0d41F957181E584dB82d2E316837B2DE1738C477',
    14: '0x72fC9b80CF03C71Ecc5637123d73428088bD0f08' 
  }

  let tokenId = 31;
  for (let i=14; i<15; i++){
    await nftBAYC.connect(acc0).transferFrom(acc0.address, accDict[i], tokenId).then(res=>{
      console.log(i, tokenId, 'succ\n', res);
    }).catch(error=>{
        console.log(ethers.utils.toUtf8String(Object.values(error.body)));
    });
    tokenId += 1;

    await nftBAYC.connect(acc0).transferFrom(acc0.address, accDict[i], tokenId).then(res=>{
      console.log(i, tokenId, 'succ\n', res);
    }).catch(error=>{
        console.log(ethers.utils.toUtf8String(Object.values(error.body)));
    });;
    tokenId += 1;
  };

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});