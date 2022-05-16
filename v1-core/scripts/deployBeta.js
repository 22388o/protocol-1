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


  /* 
  
  1. Deploy locally
  
  */

  // Get Signers
  [acc0, acc1, acc2, emergencyAdmin, admin, treasuryAccount] = await hre.ethers.getSigners();
 
  // Get network
  docsFileData += `NETWORK=${network.name.toUpperCase()}\n`;

  // Get and deploy Configurator
  let Configurator;
  let configurator;
  if (configuratorAddress) {
    Configurator = await hre.ethers.getContractFactory("Configurator");
    configurator = Configurator.attach(configuratorAddress);
    console.log("Configurator already deployed to:", configurator.address);
  } else {
    Configurator = await ethers.getContractFactory('Configurator');
    configurator = await Configurator.deploy(
        emergencyAdmin.address,
        admin.address 
    );
    await configurator.deployed();
    console.log("Configurator deployed to:", configurator.address);
  }
  docsFileData += `LENDING_POOL_CONTRACT_ADDRESS=${configurator.address}\n`;

  // Get and deploy LendingPool contract
  let LendingPool;
  let lendingPool;
  if (lendingPoolAddress) {
    LendingPool = await hre.ethers.getContractFactory("LendingPool");
    lendingPool = LendingPool.attach(lendingPoolAddress);
    console.log("LendingPool already deployed to:", lendingPool.address);
  
  } else {
    LendingPool = await hre.ethers.getContractFactory('LendingPool');
    lendingPool = await LendingPool.connect(admin).deploy(
      configurator.address,
      treasuryAccount.address
    );
    await lendingPool.deployed();
    console.log("LendingPool deployed to:", lendingPool.address);
  }
  dataItem = `LENDING_POOL_CONTRACT_ADDRESS=${lendingPool.address}\n`;
  fileData += `REACT_APP_${dataItem}`;
  docsFileData += dataItem;

  // Connect Configurator to LendingPool by setting the address
  await configurator.connect(admin).connectLendingPool(lendingPool.address);

  // // Get, deploy and connect LendingPoolBorrow to LendingPool
  // let LendingPoolBorrow;
  // let lendingPoolBorrow;
  // if (lendingPoolBorrowAddress) {
  //   LendingPoolBorrow = await hre.ethers.getContractFactory("LendingPoolBorrow");
  //   lendingPoolBorrow = LendingPoolBorrow.attach(lendingPoolBorrowAddress);
  //   console.log("LendingPoolBorrow already deployed to:", lendingPoolBorrow.address);
  // } else {
  //   LendingPoolBorrow = await ethers.getContractFactory("LendingPoolBorrow")
  //   lendingPoolBorrow = await LendingPoolBorrow.deploy(
  //     configurator.address,
  //     lendingPool.address
  //   );
  //   await lendingPoolBorrow.deployed();
  //   console.log("lendingPoolBorrow deployed to:", lendingPoolBorrow.address);
  // }

  // await configurator.connect(admin).connectLendingPoolBorrow(lendingPoolBorrow.address);
  // await configurator.connect(admin).connectLendingPoolContract("BORROW");

  // // Get, deploy and connect LendingPoolDeposit to LendingPool
  // let LendingPoolDeposit;
  // let lendingPoolDeposit;
  // if (lendingPoolDepositAddress) {
  //   LendingPoolDeposit = await hre.ethers.getContractFactory("LendingPoolDeposit");
  //   lendingPoolDeposit = LendingPoolDeposit.attach(lendingPoolDepositAddress);
  //   console.log("LendingPoolDeposit already deployed to:", lendingPoolDeposit.address);  
  // } else {
  //   LendingPoolDeposit = await ethers.getContractFactory('LendingPoolDeposit');
  //   lendingPoolDeposit = await LendingPoolDeposit.deploy(
  //       configurator.address,
  //       lendingPool.address,
  //   );
  //   await lendingPoolDeposit.deployed();
  //   console.log("lendingPoolDeposit deployed to:", lendingPoolDeposit.address);
  // }

  // await configurator.connect(admin).connectLendingPoolDeposit(lendingPoolDeposit.address);
  // await configurator.connect(admin).connectLendingPoolContract("DEPOSIT");

  // // Get, deploy and connect LendingPoolLiquidate to LendingPool
  // let LendingPoolLiquidate;
  // let lendingPoolLiquidate;
  // if (lendingPoolLiquidateAddress) {
  //   LendingPoolLiquidate = await hre.ethers.getContractFactory("LendingPoolLiquidate");
  //   lendingPoolLiquidate = LendingPoolLiquidate.attach(lendingPoolLiquidateAddress);
  //   console.log("LendingPoolLiquidate already deployed to:", lendingPoolLiquidate.address);  
  // } else {
  //   LendingPoolLiquidate = await ethers.getContractFactory('LendingPoolLiquidate');
  //   lendingPoolLiquidate = await LendingPoolLiquidate.deploy(
  //       configurator.address,
  //       lendingPool.address,
  //   );
  //   await lendingPoolLiquidate.deployed();
  //   console.log("lendingPoolLiquidate deployed to:", lendingPoolLiquidate.address);
  // }

  // await configurator.connect(admin).connectLendingPoolLiquidate(lendingPoolLiquidate.address);
  // await configurator.connect(admin).connectLendingPoolContract("LIQUIDATE");

  // // Get, deploy and connect LendingPoolBid to LendingPool
  // let LendingPoolBid;
  // let lendingPoolBid;
  // if (lendingPoolBidAddress) {
  //   LendingPoolBid = await hre.ethers.getContractFactory("LendingPoolBid");
  //   lendingPoolBid = LendingPoolBid.attach(lendingPoolBidAddress);
  //   console.log("LendingPoolBid already deployed to:", lendingPoolBid.address);  
  // } else {
  //   LendingPoolBid = await ethers.getContractFactory('LendingPoolBid');
  //   lendingPoolBid = await LendingPoolBid.deploy(
  //       configurator.address,
  //       lendingPool.address,
  //   );
  //   await lendingPoolBid.deployed();
  //   console.log("lendingPoolBid deployed to:", lendingPoolBid.address);
  // }

  // await configurator.connect(admin).connectLendingPoolBid(lendingPoolBid.address);
  // await configurator.connect(admin).connectLendingPoolContract("BID");

  // // Get, deploy and connect LendingPoolRedeem to LendingPool
  // let LendingPoolRedeem;
  // let lendingPoolRedeem;
  // if (lendingPoolRedeemAddress) {
  // LendingPoolRedeem = await hre.ethers.getContractFactory("LendingPoolRedeem");
  // lendingPoolRedeem = LendingPoolRedeem.attach(lendingPoolRedeemAddress);
  // console.log("LendingPoolRedeem already deployed to:", lendingPoolRedeem.address);  
  // } else {
  // LendingPoolRedeem = await ethers.getContractFactory('LendingPoolRedeem');
  // lendingPoolRedeem = await LendingPoolRedeem.deploy(
  //     configurator.address,
  //     lendingPool.address,
  // );
  // await lendingPoolRedeem.deployed();
  // console.log("lendingPoolRedeem deployed to:", lendingPoolRedeem.address);
  // }

  // await configurator.connect(admin).connectLendingPoolRedeem(lendingPoolRedeem.address);
  // await configurator.connect(admin).connectLendingPoolContract("REDEEM");

  // // Get, deploy and connect LendingPoolRepay to LendingPool
  // let LendingPoolRepay;
  // let lendingPoolRepay;
  // if (lendingPoolRepayAddress) {
  //   LendingPoolRepay = await hre.ethers.getContractFactory("LendingPoolRepay");
  //   lendingPoolRepay = LendingPoolRepay.attach(lendingPoolRepayAddress);
  //   console.log("LendingPoolRepay already deployed to:", lendingPoolRepay.address);  
  // } else {
  //   LendingPoolRepay = await ethers.getContractFactory('LendingPoolRepay');
  //   lendingPoolRepay = await LendingPoolRepay.deploy(
  //       configurator.address,
  //       lendingPool.address,
  //   );
  //   await lendingPoolRepay.deployed();
  //   console.log("lendingPoolRepay deployed to:", lendingPoolRepay.address);
  // }

  // await configurator.connect(admin).connectLendingPoolRepay(lendingPoolRepay.address);
  // await configurator.connect(admin).connectLendingPoolContract("REPAY");

  // // Get, deploy and connect LendingPoolWithdraw to LendingPool
  // let LendingPoolWithdraw;
  // let lendingPoolWithdraw;
  // if (lendingPoolWithdraw) {
  //   LendingPoolWithdraw = await hre.ethers.getContractFactory("LendingPoolWithdraw");
  //   lendingPoolWithdraw = LendingPoolWithdraw.attach(lendingPoolWithdrawAddress);
  //   console.log("LendingPoolWithdraw already deployed to:", lendingPoolWithdraw.address);
  // } else {
  //   LendingPoolWithdraw = await ethers.getContractFactory('LendingPoolWithdraw');
  //   lendingPoolWithdraw = await LendingPoolWithdraw.deploy(
  //       configurator.address,
  //       lendingPool.address,
  //   );
  //   await lendingPoolWithdraw.deployed();
  //   console.log("lendingPoolWithdraw deployed to:", lendingPoolWithdraw.address);
  // }
  // await configurator.connect(admin).connectLendingPoolWithdraw(lendingPoolWithdraw.address);
  // await configurator.connect(admin).connectLendingPoolContract("WITHDRAW");

  // Get and deploy CollateralManager contract
  let CollateralManager;
  let collateralManager;
  if (collateralManagerAddress) {
    CollateralManager = await hre.ethers.getContractFactory("CollateralManager");
    collateralManager = CollateralManager.attach(collateralManagerAddress);
    console.log("CollateralManager already deployed to:", collateralManager.address);  
  } else {
    CollateralManager = await hre.ethers.getContractFactory('CollateralManager');
    collateralManager = await CollateralManager.deploy(
      configurator.address,
      lendingPool.address
    );
    await collateralManager.deployed();
    console.log("CollateralManager deployed to:", collateralManager.address);
  }
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
  let TokenPriceConsumer;
  let tokenPriceConsumer;
  if (tokenPriceConsumerAddress) {
    TokenPriceConsumer = await hre.ethers.getContractFactory("TokenPriceConsumer");
    tokenPriceConsumer = TokenPriceConsumer.attach(tokenPriceConsumerAddress);  
    console.log("TokenPriceConsumer already deployed to:", tokenPriceConsumer.address);
  } else {
    TokenPriceConsumer = await ethers.getContractFactory('TokenPriceConsumer');
    tokenPriceConsumer = await TokenPriceConsumer.deploy(
      "0xAa7F6f7f507457a1EE157fE97F6c7DB2BEec5cD0" // registry
    );
    console.log("TokenPriceConsumer deployed to:", tokenPriceConsumer.address);
  }
  dataItem = `TOKEN_PRICE_CONSUMER_CONTRACT_ADDRESS=${tokenPriceConsumer.address}\n`;
  fileData += `REACT_APP_${dataItem}`;
  docsFileData += dataItem;

  await configurator.connect(admin).connectTokenPriceConsumer(tokenPriceConsumer.address);
  await configurator.connect(admin).connectLendingPoolContract("TOKEN_PRICE_ORACLE");

  // Get and deploy NFTPriceConsumer
  let NFTPriceConsumer;
  let nftPriceConsumer;
  if (nftPriceConsumerAddress) {
    NFTPriceConsumer = await hre.ethers.getContractFactory("NFTPriceConsumer");
    nftPriceConsumer = NFTPriceConsumer.attach(nftPriceConsumerAddress);
    console.log("NFTPriceConsumer already deployed to:", nftPriceConsumer.address);  
  } else {
    NFTPriceConsumer = await ethers.getContractFactory('NFTPriceConsumer');
    nftPriceConsumer = await NFTPriceConsumer.deploy(
      configurator.address,
      10 // window size
    );
    console.log("NFTPriceConsumer deployed to:", nftPriceConsumer.address);
  }
  dataItem = `NFT_PRICE_CONSUMER_CONTRACT_ADDRESS=${nftPriceConsumer.address}\n`;
  fileData += `REACT_APP_${dataItem}`;
  docsFileData += dataItem;

  await configurator.connect(admin).connectNFTPriceConsumer(nftPriceConsumer.address);
  await configurator.connect(admin).connectLendingPoolContract("NFT_PRICE_ORACLE");

  // Get NFT contracts
  const NFT = await hre.ethers.getContractFactory('NFT');
  
  // BAYC:
  let nftBAYC;
  if (nftBaycAddress) {
    nftBAYC = NFT.attach(nftBaycAddress);
    console.log("NFT BAYC already deployed to:", nftBAYC.address);
  } else {
    nftBAYC = await NFT.connect(admin).deploy('Bored Ape Yacht Club', 'BAYC');
    await nftBAYC.deployed();
    console.log("NFT BAYC deployed to:", nftBAYC.address);
  }
  dataItem = `NFT_BAYC_CONTRACT_ADDRESS=${nftBAYC.address}\n`;
  fileData += `REACT_APP_${dataItem}`;
  docsFileData += dataItem;

  // Get and deploy AssetToken contracts
  const assetTokenSupply = hre.ethers.utils.parseEther("5000000.0");
  const assetTokenInitialBalance = hre.ethers.utils.parseEther("150000.0");
  const assetTokenInitialBalanceWETH = hre.ethers.utils.parseEther("20000");
  const AssetToken = await hre.ethers.getContractFactory('AssetToken');

  // WETH Asset Token:
  let assetTokenWETH;
  if (assetTokenWethAddress) {
    assetTokenWETH = await AssetToken.attach(assetTokenWethAddress);
    console.log("assetTokenWETH already deployed to:", assetTokenWETH.address);
  } else {
    assetTokenWETH = await AssetToken.connect(admin).deploy('WETH Token', 'WETH', assetTokenSupply);
    await assetTokenWETH.deployed();
    console.log("assetTokenWETH deployed to:", assetTokenWETH.address);
  }
  dataItem = `ASSET_TOKEN_WETH_CONTRACT_ADDRESS=${assetTokenWETH.address}\n`;
  fileData += `REACT_APP_${dataItem}`;
  docsFileData += dataItem;

  // // Get and deploy fToken contracts
  // const FToken = await hre.ethers.getContractFactory('FToken');

  // // WETH FToken:
  // let fTokenBAYCWETH;
  // if (ftokenBaycWethAddress) {
  //   fTokenBAYCWETH = FToken.attach(ftokenBaycWethAddress);
  //   console.log("fTokenBAYCWETH already deployed to:", fTokenBAYCWETH.address);
  // } else {
  //   fTokenBAYCWETH = await FToken.connect(admin).deploy(
  //     configurator.address,
  //     lendingPool.address,
  //     treasuryAccount.address,
  //     nftBAYC.address,
  //     assetTokenWETH.address,
  //     'BAYC-WETH fToken', 
  //     'fBAYCWETH'
  //   );
  //   await fTokenBAYCWETH.deployed();
  //   console.log("fTokenBAYCWETH deployed to:", fTokenBAYCWETH.address);
  // }
  // dataItem = `N_TOKEN_WETH_CONTRACT_ADDRESS=${fTokenBAYCWETH.address}\n`;
  // fileData += `REACT_APP_${dataItem}`;
  // docsFileData += dataItem;

  // // Get and deploy debtToken contracts
  // const DebtToken = await hre.ethers.getContractFactory('DebtToken');
  
  // WETH:
  // let debtTokenBAYCWETH;
  // if (debtTokenBAYCWETHAddress) {
  //   debtTokenBAYCWETH = DebtToken.attach(debtTokenBAYCWETHAddress);
  //   console.log("debtTokenBAYCWETH already deployed to:", debtTokenBAYCWETH.address);
  // } else {
  //   debtTokenBAYCWETH = await DebtToken.connect(admin).deploy(
  //     configurator.address,
  //     lendingPool.address,
  //     'BAYC-WETH debtToken', 
  //     'dBAYCWETH'
  //   );
  //   await debtTokenBAYCWETH.deployed();  
  //   console.log("debtTokenBAYCWETH deployed to:", debtTokenBAYCWETH.address);
  // }
  // dataItem = `DEBT_TOKEN_WETH_CONTRACT_ADDRESS=${debtTokenBAYCWETH.address}\n`;
  // fileData += `REACT_APP_${dataItem}`;
  // docsFileData += dataItem;

  // // Initialize Reserves
  // // WETH:
  // await configurator.connect(admin).initLendingPoolReserve(
  //   nftBAYC.address,
  //   assetTokenWETH.address, 
  //   fTokenBAYCWETH.address, 
  //   debtTokenBAYCWETH.address, 
  //   "WETH"
  // );
  // console.log('Initialized Reserves');

  // Set NFT liquidation thresholds
  await configurator.connect(admin).setCollateralManagerLiquidationThreshold(nftBAYC.address, 150); // in percent

  // Whitelist NFT
  const whitelist = await collateralManager.getWhitelist();
  if (whitelist.length < 1) {
    await configurator.connect(admin).updateCollateralManagerWhitelist(nftBAYC.address, true);
  }

  // Set NFT-specific APRs
  await configurator.connect(admin).setCollateralManagerInterestRate(nftBAYC.address, assetTokenWETH.address, ethers.utils.parseUnits('20', 25)); // 20% in RAY (1e27)

  // Set Mocked Oracle NFT prices
  let mockFloorPrice;
  mockFloorPrice = ethers.utils.parseUnits('130', 18);
  // await configurator.connect(admin).setNFTPriceConsumerFloorPrice(nftBAYC.address, mockFloorPrice);
  let testFloorPrice = await nftPriceConsumer.getFloorPrice(nftBAYC.address);
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

  async function transferTokens(accNum, token) {
    let transferAmount = assetTokenInitialBalance;
    if (inverseTokenDict[token.address]=="WETH") {
      transferAmount = assetTokenInitialBalanceWETH;
    }
    let balance;
    balance = await token.balanceOf(admin.address);
    console.log('admin balance', balance);
    console.log('transferAmount', transferAmount);
    await token.connect(admin).transfer(accDict[accNum].address, transferAmount);
    console.log(`Transferred acc${accNum} (${accDict[accNum].address}) ${transferAmount/10**18} ${inverseTokenDict[token.address]} (${token.address})`)
    balance = await token.balanceOf(accDict[accNum].address);
    console.log('balance:', balance);
  }
  await transferTokens(0, assetTokenWETH);
  await transferTokens(1, assetTokenWETH);
  await transferTokens(2, assetTokenWETH);


  let balance;
  balance = await assetTokenWETH.balanceOf(accDict[0].address);
  console.log('balance0:', balance);

  balance = await assetTokenWETH.balanceOf(accDict[1].address);
  console.log('balance1:', balance);

  balance = await assetTokenWETH.balanceOf(accDict[2].address);
  console.log('balance2:', balance);

  // Mint NFTs to acc1 and acc2
  const nftDict = {"BAYC": nftBAYC} //"PUNK": nftPUNK, 
  async function mint(nftName, accNum, tokenId) {
    const nft = nftDict[nftName];
    const acc = accDict[accNum];
    await nft.mint(acc.address, tokenId);
    console.log(`${nftName} #${tokenId} minted to acc${accNum} (address: ${acc.address})`)
  }

  // for(let i=71; i< 80; i++) {
  //   await mint("BAYC", 0, i); 
  // }

  // for(let i=80; i< 90; i++) {
  //   await mint("BAYC", 1, i); 
  // }

  // for(let i=90; i< 100; i++) {
  //   await mint("BAYC", 2, i); 
  // }

  /* 
  
  3. Create deposits and borrows (including defaulted borrows) from accounts 2 and 3.
  */

  // Deposits from Account 1
  console.log('Deposits from Account 1');
  let depositAmount; 
  depositAmount = hre.ethers.utils.parseEther("200.00");
  await assetTokenWETH.connect(acc1).approve(lendingPool.address, depositAmount);
  console.log('Approved');
  await lendingPool.connect(acc1).deposit(nftBAYC.address, assetTokenWETH.address, depositAmount);

  // Deposits from Account 2
  console.log('Deposits from Account 2');
  depositAmount = hre.ethers.utils.parseEther("135");
  await assetTokenWETH.connect(acc2).approve(lendingPool.address, depositAmount);
  console.log('Approved');
  await lendingPool.connect(acc2).deposit(nftBAYC.address, assetTokenWETH.address, depositAmount);

  // Deposit from admin
  console.log('Deposits from Account 3');
  depositAmount = hre.ethers.utils.parseEther("10000");
  await assetTokenWETH.connect(admin).approve(lendingPool.address, depositAmount);
  console.log('Approved');
  await lendingPool.connect(admin).deposit(nftBAYC.address, assetTokenWETH.address, depositAmount);

  /*
  4. Create borrows
  */
  // console.log('Create Borrows');
  // let borrowAmount; 
  // borrowAmount = hre.ethers.utils.parseEther("85");
  // for (let i=0; i< 2; i++) {
  //   await nftBAYC.connect(accDict[0]).approve(collateralManager.address, i);
  //   await lendingPool.connect(accDict[0]).borrow(
  //     assetTokenWETH.address,
  //     borrowAmount,
  //     nftBAYC.address,
  //     i
  //   )
  // }

  // borrowAmount = hre.ethers.utils.parseEther("85");
  // for (let i=84; i< 86; i++) {
  //   await nftBAYC.connect(accDict[1]).approve(collateralManager.address, i);
  //   await lendingPool.connect(accDict[1]).borrow(
  //     assetTokenWETH.address,
  //     borrowAmount,
  //     nftBAYC.address,
  //     i
  //   )
  // }

  // borrowAmount = hre.ethers.utils.parseEther("85");
  // for (let i=98; i< 100; i++) {
  //   await nftBAYC.connect(accDict[2]).approve(collateralManager.address, i);
  //   await lendingPool.connect(accDict[2]).borrow(
  //     assetTokenWETH.address,
  //     borrowAmount,
  //     nftBAYC.address,
  //     i
  //   )
  // }

  /*
  5. Liquidations
    - 2x undercollateralized, not yet liquidiated
    - 2x liquidated, ready for bids 
    - 2x liquidated, to be redeemed 
  */
  console.log('Trigger Liquidations');
  mockFloorPrice = ethers.utils.parseUnits('100', 18);
  await configurator.connect(admin).setNFTPriceConsumerFloorPrice(nftBAYC.address, mockFloorPrice);

  // To be Liquidated
  let bidAmount; 
  bidAmount = ethers.utils.parseUnits('88', 18);
  console.log('Trigger Liquidation1');
  await assetTokenWETH.connect(admin).approve(lendingPool.address, bidAmount);
  await lendingPool.connect(admin).bid(assetTokenWETH.address, bidAmount, 1);
  console.log('Trigger Liquidation2');
  await assetTokenWETH.connect(admin).approve(lendingPool.address, bidAmount);
  await lendingPool.connect(admin).bid(assetTokenWETH.address, bidAmount, 2);

  // To be redeemed (assuming we are acc1)
  bidAmount = ethers.utils.parseUnits('88', 18);
  console.log('Trigger Liquidation3');
  await assetTokenWETH.connect(admin).approve(lendingPool.address, bidAmount);
  await lendingPool.connect(admin).bid(assetTokenWETH.address, bidAmount, 3);
  console.log('Trigger Liquidation4');
  await assetTokenWETH.connect(admin).approve(lendingPool.address, bidAmount);
  await lendingPool.connect(admin).bid(assetTokenWETH.address, bidAmount, 4);

  // Leaving Acc2s to be triggered for liquidation
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});