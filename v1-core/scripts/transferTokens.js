// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { expect } = require('chai');
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
  assetTokenWethAddress = "0xD57fC16501915A642704fD994d05E763D509C6A4";
  ftokenBaycWethAddress = "0x43bf39DC23946C5532443B78F26FCEe94A63620D";
  debtTokenBAYCWETHAddress = "0x59122Cc60b93d3400393808AA52CF2D1FF45b293";

  // Get Signers
  [acc0, acc1, acc2, emergencyAdmin, admin, treasuryAccount] = await hre.ethers.getSigners();
 
  let AssetToken;
  let assetTokenWETH;
  AssetToken = await hre.ethers.getContractFactory('AssetToken');
  assetTokenWETH = await AssetToken.attach(assetTokenWethAddress);

  const transferAmount = hre.ethers.utils.parseUnits('200', 18);

  // // let address = "0xFe7Ae2E3F478b51ba312beEB918365cF773721a5";

  // console.log('transferAmount', transferAmount);

  // let balance;
  // balance = await acc1.getBalance();
  // console.log('aac1', balance);

  // balance = await admin.getBalance();
  // console.log('admin', balance);

  // const provider = hre.ethers.getDefaultProvider();

  // let gasPrice = await provider.getGasPrice();
  // console.log('gasPrice', gasPrice);



  // var options = {
  //   gasPrice: gasPrice,
  //   gasLimit: 8000000000,
  // };

  // await assetTokenWETH.connect(acc1).approve(assetTokenWETH.address, transferAmount);
  // await assetTokenWETH.connect(acc1).transferFrom(acc1.address, admin.address, transferAmount, options).then(res=>{
  //   console.log('succ\n', res);
  // }).catch(error=>{
  //     console.log(ethers.utils.toUtf8String(Object.values(error.body)));
  // });
  // console.log('txn', txn);

  // balance = await acc1.getBalance();
  // console.log('aac1', balance);

  // balance = await admin.getBalance();
  // console.log('admin', balance);


  let balanceSender1;
  let balanceSender2;
  let balanceReceiver1;
  let balanceReceiver2;
  
  // balanceSender1 = await assetTokenWETH.balanceOf(acc2.address);
  // balanceReceiver1 = await assetTokenWETH.balanceOf(acc1.address);
  
  // await assetTokenWETH.connect(acc2).transfer(acc1.address, transferAmount).then(res=>{
  //     console.log('succ\n', res);
  //   }).catch(error=>{
  //       console.log(ethers.utils.toUtf8String(Object.values(error.body)))
  //   });
  
  // balanceSender2 = await assetTokenWETH.balanceOf(acc2.address);
  // balanceReceiver2 = await assetTokenWETH.balanceOf(acc1.address);
  
  // console.log('transferAmount', transferAmount);
  // console.log('balanceSender1:', balanceSender1);
  // console.log('balanceSender2:', balanceSender2);
  // console.log('balanceReceiver1:', balanceReceiver1);
  // console.log('balanceReceiver2:', balanceReceiver2);

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

  for (let i=14; i<15; i++ ) {
    await assetTokenWETH.connect(acc2).transfer(accDict[i], transferAmount).then(res=>{
      console.log(i, 'succ \n', res);
    }).catch(error=>{
        console.log(ethers.utils.toUtf8String(Object.values(error.body)))
    });
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});