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

  /* 
  
  1. Deploy locally
  
  */

  // Get Signers
  [acc0, acc1, acc2, emergencyAdmin, admin, treasuryAccount] = await hre.ethers.getSigners();
 
  // Get network
  docsFileData += `NETWORK=${network.name.toUpperCase()}\n`;

  // Get and deploy Configurator
  Configurator = await ethers.getContractFactory('Configurator');
  configurator = await Configurator.deploy(
      emergencyAdmin.address,
      admin.address 
  );
  await configurator.deployed();
  console.log("Configurator deployed to:", configurator.address);
  docsFileData += `LENDING_POOL_CONTRACT_ADDRESS=${configurator.address}\n`;

  // Get and deploy LendingPool contract
  const LendingPool = await hre.ethers.getContractFactory('LendingPool');
  const lendingPool = await LendingPool.connect(admin).deploy(
    configurator.address,
    treasuryAccount.address
  );
  await lendingPool.deployed();
  console.log("LendingPool deployed to:", lendingPool.address);
  dataItem = `LENDING_POOL_CONTRACT_ADDRESS=${lendingPool.address}\n`;
  fileData += `REACT_APP_${dataItem}`;
  docsFileData += dataItem;

  // Connect Configurator to LendingPool by setting the address
  await configurator.connect(admin).connectLendingPool(lendingPool.address);

  // Get, deploy and connect LendingPoolBorrow to LendingPool
  LendingPoolBorrow = await ethers.getContractFactory("LendingPoolBorrow")
  lendingPoolBorrow = await LendingPoolBorrow.deploy(
    configurator.address,
    lendingPool.address
  );
  await lendingPoolBorrow.deployed();
  await configurator.connect(admin).connectLendingPoolBorrow(lendingPoolBorrow.address);
  await configurator.connect(admin).connectLendingPoolContract("BORROW");

  // Get, deploy and connect LendingPoolDeposit to LendingPool
  LendingPoolDeposit = await ethers.getContractFactory('LendingPoolDeposit');
  lendingPoolDeposit = await LendingPoolDeposit.deploy(
      configurator.address,
      lendingPool.address,
  );
  await lendingPoolDeposit.deployed();
  await configurator.connect(admin).connectLendingPoolDeposit(lendingPoolDeposit.address);
  await configurator.connect(admin).connectLendingPoolContract("DEPOSIT");

  // Get, deploy and connect LendingPoolLiquidate to LendingPool
  LendingPoolLiquidate = await ethers.getContractFactory('LendingPoolLiquidate');
  lendingPoolLiquidate = await LendingPoolLiquidate.deploy(
      configurator.address,
      lendingPool.address,
  );
  await lendingPoolLiquidate.deployed();
  await configurator.connect(admin).connectLendingPoolLiquidate(lendingPoolLiquidate.address);
  await configurator.connect(admin).connectLendingPoolContract("LIQUIDATE");

  // Get, deploy and connect LendingPoolRepay to LendingPool
  LendingPoolRepay = await ethers.getContractFactory('LendingPoolRepay');
  lendingPoolRepay = await LendingPoolRepay.deploy(
      configurator.address,
      lendingPool.address,
  );
  await lendingPoolRepay.deployed();
  await configurator.connect(admin).connectLendingPoolRepay(lendingPoolRepay.address);
  await configurator.connect(admin).connectLendingPoolContract("REPAY");

  // Get, deploy and connect LendingPoolWithdraw to LendingPool
  LendingPoolWithdraw = await ethers.getContractFactory('LendingPoolWithdraw');
  lendingPoolWithdraw = await LendingPoolWithdraw.deploy(
      configurator.address,
      lendingPool.address,
  );
  await lendingPoolWithdraw.deployed();
  lendingPoolWithdrawAddress = await lendingPoolWithdraw.resolvedAddress;
  await configurator.connect(admin).connectLendingPoolWithdraw(lendingPoolWithdraw.address);
  await configurator.connect(admin).connectLendingPoolContract("WITHDRAW");

  // Get and deploy CollateralManager contract
  const CollateralManager = await hre.ethers.getContractFactory('CollateralManager');
  const collateralManager = await CollateralManager.deploy(
    configurator.address,
    lendingPool.address
  );
  await collateralManager.deployed();
  console.log("CollateralManager deployed to:", collateralManager.address);
  dataItem = `COLLATERAL_MANAGER_CONTRACT_ADDRESS=${collateralManager.address}\n`;
  fileData += `REACT_APP_${dataItem}`;
  docsFileData += dataItem;

  // Connect CollateralManager in Configurator
  await configurator.connect(admin).connectCollateralManager(
      collateralManager.address
  );

  // Link CollateralManager to LendingPool
  await configurator.connect(admin).connectLendingPoolContract("CM");

  // Get and deploy TokenPriceConsumer
  TokenPriceConsumer = await ethers.getContractFactory('TokenPriceConsumer');
  tokenPriceConsumer = await TokenPriceConsumer.deploy(
    "0xAa7F6f7f507457a1EE157fE97F6c7DB2BEec5cD0" // registry
  );
  await configurator.connect(admin).connectTokenPriceConsumer(tokenPriceConsumer.address);
  await configurator.connect(admin).connectLendingPoolContract("TOKEN_PRICE_ORACLE");

  // Get and deploy NFTPriceConsumer
  NFTPriceConsumer = await ethers.getContractFactory('NFTPriceConsumer');
  nftPriceConsumer = await NFTPriceConsumer.deploy(
    configurator.address,
    10 // window size
  );
  await configurator.connect(admin).connectNFTPriceConsumer(nftPriceConsumer.address);
  await configurator.connect(admin).connectLendingPoolContract("NFT_PRICE_ORACLE");
  console.log("nftPriceConsumer deployed to:", nftPriceConsumer.address);
  dataItem = `NFT_PRICE_CONSUMER_CONTRACT_ADDRESS=${nftPriceConsumer.address}\n`;
  fileData += `REACT_APP_${dataItem}`;
  docsFileData += dataItem;


  // Get and deploy AssetToken contracts
  const assetTokenSupply = hre.ethers.utils.parseEther("5000000.0");
  const assetTokenInitialBalance = hre.ethers.utils.parseEther("150000.0");
  const assetTokenInitialBalanceWETH = hre.ethers.utils.parseEther("200.0");
  const AssetToken = await hre.ethers.getContractFactory('AssetToken');

  // Get NFT contracts
  // XPUNK:
  nftXPUNK = "0x0d0167a823c6619d430b1a96ad85b888bcf97c37";
  console.log("NFT XPUNK taken from:", nftXPUNK);
  dataItem = `NFT_XPUNK_CONTRACT_ADDRESS=${nftXPUNK}\n`;
  fileData += `REACT_APP_${dataItem}`;
  docsFileData += dataItem;

  // WETH Asset Token:
  // WETH Asset Token:
  assetTokenWETH = await AssetToken.connect(admin).deploy('WETH Token', 'WETH', assetTokenSupply);
  await assetTokenWETH.deployed();
  console.log("assetTokenWETH deployed to:", assetTokenWETH.address);
  dataItem = `ASSET_TOKEN_WETH_CONTRACT_ADDRESS=${assetTokenWETH.address}\n`;
  fileData += `REACT_APP_${dataItem}`;
  docsFileData += dataItem;
  
  // Get and deploy fToken contracts
  FToken = await hre.ethers.getContractFactory('FToken');

  // WETH FToken:
  fTokenXPUNKWETH = await FToken.connect(admin).deploy(
    configurator.address,
    lendingPool.address,
    treasuryAccount.address,
    nftXPUNK,
    assetTokenWETH.address,
    'XPUNK-WETH F-Token', 
    'FxpunkWETH'
  );

  await fTokenXPUNKWETH.deployed();
  console.log("fTokenXPUNKWETH deployed to:", fTokenXPUNKWETH.address);
  dataItem = `N_TOKEN_WETH_CONTRACT_ADDRESS=${fTokenXPUNKWETH.address}\n`;
  fileData += `REACT_APP_${dataItem}`;
  docsFileData += dataItem;

  // Get and deploy debtToken contracts
  DebtToken = await hre.ethers.getContractFactory('DebtToken');
  
  // WETH:
  debtTokenXPUNKWETH = await DebtToken.connect(admin).deploy(
    configurator.address,
    lendingPool.address,
    'XPUNKWETH debtToken', 
    'DxpunkWETH'
  );
  await debtTokenXPUNKWETH.deployed();  
  console.log("debtTokenXPUNKWETH deployed to:", debtTokenXPUNKWETH.address);
  dataItem = `DEBT_TOKEN_WETH_CONTRACT_ADDRESS=${debtTokenXPUNKWETH.address}\n`;
  fileData += `REACT_APP_${dataItem}`;
  docsFileData += dataItem;

  // Initialize Reserves
  // WETH:
  await configurator.connect(admin).initLendingPoolReserve(
    nftXPUNK,
    assetTokenWETH.address, 
    fTokenXPUNKWETH.address, 
    debtTokenXPUNKWETH.address, 
    "WETH"
  );
  console.log('Initialized Reserves');

  // Set NFT liquidation thresholds
  // await configurator.connect(admin).setCollateralManagerLiquidationThreshold(nftPUNK.address, 150); // in percent
  await configurator.connect(admin).setCollateralManagerLiquidationThreshold(nftXPUNK, 150); // in percent

  // Whitelist NFT
  // await configurator.connect(admin).updateCollateralManagerWhitelist(nftPUNK.address, true);
  await configurator.connect(admin).updateCollateralManagerWhitelist(nftXPUNK, true);

  // Set NFT-specific APRs
  console.log('assetTokenWETH.address', assetTokenWETH.address);
  // await configurator.connect(admin).setCollateralManagerInterestRateassetTokenWETH.address, 18);
  await configurator.connect(admin).setCollateralManagerInterestRate(nftXPUNK, assetTokenWETH.address, ethers.utils.parseUnits('20', 25)); // 20% in RAY (1e27)

  // Set Mocked Oracle NFT prices
  let mockFloorPrice;
  // mockFloorPrice = ethers.utils.parseUnits('100', 18);
  // await lendingPool.setMockFloorPrice(nftPUNK.address, mockFloorPrice);
  mockFloorPrice = ethers.utils.parseUnits('98', 15);
  await configurator.connect(admin).setNFTPriceConsumerFloorPrice(nftXPUNK, mockFloorPrice);
  let testFloorPrice = await nftPriceConsumer.getFloorPrice(nftXPUNK);
  console.log('testFloorPrice:', testFloorPrice);

  // Writes fileData to interface ../interface/.env 
  await writeContractAddressesToFile(fileData, envFile);

  // Write out docs data if network == ropsten
  if (network.name=="ropsten") {
    await writeContractAddressesToFile(docsFileData, docsFile);
  }

  /* 
  
  2. Transfer Asset Tokens and NFTs to accounts 0, 1 and 2.
  */

  // Transfer funds to acc0, acc1 and acc2
  const accDict = {0: acc0, 1: acc1, 2: acc2}
  const tokenDict = {
    "WETH": assetTokenWETH.address
  }
  function swap(_dict){ 
    var ret = {};
    for(var key in _dict){
      ret[_dict[key]] = key;
    }
    return ret;
  }
  const inverseTokenDict = swap(tokenDict);

  async function transfer(accNum, token) {
    let transferAmount = assetTokenInitialBalance
    if (inverseTokenDict[token.address]=="WETH") {
      transferAmount = assetTokenInitialBalanceWETH;
    }
    await token.connect(admin).transfer(accDict[accNum].address, transferAmount);
    console.log(`Transferred acc${accNum} (${accDict[accNum].address}) ${transferAmount/10**18} ${inverseTokenDict[token.address]} (${token.address})`)
    let balance = await token.balanceOf(accDict[accNum].address);
    console.log('balance:', balance);
  }
  await transfer(0, assetTokenWETH);
  await transfer(1, assetTokenWETH);
  await transfer(2, assetTokenWETH);


  // Mint NFTs to acc1 and acc2
  // const nftDict = {"XPUNK": nftXPUNK} //"PUNK": nftPUNK, 
  // async function mint(nftName, accNum, tokenId) {
  //   const nft = nftDict[nftName];
  //   const acc = accDict[accNum];
  //   await nft.mint(acc.address, tokenId);
  //   console.log(`${nftName} #${tokenId} minted to acc${accNum} (address: ${acc.address})`)
  // }
  // await mint("XPUNK", 0, 0);
  // await mint("XPUNK", 0, 1);
  // await mint("XPUNK", 1, 2);
  // await mint("XPUNK", 1, 3);
  // await mint("XPUNK", 2, 4);
  // await mint("XPUNK", 2, 5); 

  /* 
  
  3. Create deposits and borrows (including defaulted borrows) from accounts 2 and 3.
  */

  // Deposits from Account 1
  let depositAmount; 
  depositAmount = hre.ethers.utils.parseEther("200.00");
  await assetTokenWETH.connect(acc1).approve(lendingPool.address, depositAmount);
  await lendingPool.connect(acc1).deposit(nftXPUNK, assetTokenWETH.address, depositAmount);

  // Deposits from Account 2
  depositAmount = hre.ethers.utils.parseEther("135");
  await assetTokenWETH.connect(acc2).approve(lendingPool.address, depositAmount);
  await lendingPool.connect(acc2).deposit(nftXPUNK, assetTokenWETH.address, depositAmount);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});