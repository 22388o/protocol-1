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

  /* 
  
  1. Deploy locally
  
  */

  
  // Get Signers
  [acc0, acc1, acc2, emergencyAdmin, admin, treasuryAccount] = await hre.ethers.getSigners();
 
  // Get network
  docsFileData += `NETWORK=${network.name.toUpperCase()}\n`;


  const CollateralManager = await hre.ethers.getContractFactory("CollateralManager");
  const collateralManager = CollateralManager.attach(collateralManagerAddress);

  const whitelist = await collateralManager.getWhitelist();
  console.log('whitelist', whitelist);



  // Whitelist NFT
  // await configurator.connect(admin).updateCollateralManagerWhitelist(nftPUNK.address, true);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});