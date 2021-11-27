// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");
const envFile = "../interface/.env";
let fileData = "";
  
async function writeContractAddressesToInterfaceEnv(fileData) {
  fs.writeFile(envFile, fileData, (err) => {
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

  /* 
  
  1. Deploy locally
  
  */

  // Get Signers 
  // let acc0;
  // let acc1;
  // let acc2;
  // let emergencyAdmin;
  // let admin;
  // let treasuryAccount;

  [acc0, acc1, acc2, emergencyAdmin, admin, treasuryAccount] = await hre.ethers.getSigners();
 
  // // Update undefinted accounts (for testnet deployment with only two accounts provided)
  // function updateUndefinedAccount(x, acc) {
  //   if (x === undefined) {
  //     console.log('Setting undefined account to acc0');
  //     return acc
  //   }
  //   return x;
  // }
  // acc2 = updateUndefinedAccount(acc2, acc0);
  // emergencyAdmin = updateUndefinedAccount(emergencyAdmin, acc0);
  // admin = updateUndefinedAccount(admin, acc0);
  // treasuryAccount = updateUndefinedAccount(treasuryAccount, acc0);
  
  // Get and deploy Configurator
  Configurator = await ethers.getContractFactory('Configurator');
  configurator = await Configurator.deploy(
      emergencyAdmin.address,
      admin.address 
  );
  await configurator.deployed();

  // Get and deploy LendingPool contract
  const LendingPool = await hre.ethers.getContractFactory('LendingPool');
  const lendingPool = await LendingPool.connect(admin).deploy(
    configurator.address,
    treasuryAccount.address
  );
  await lendingPool.deployed();
  console.log("LendingPool deployed to:", lendingPool.address);
  fileData += `REACT_APP_LENDING_POOL_CONTRACT_ADDRESS=${lendingPool.address}\n`;

  // Connect LendingPool in Configurator
  await configurator.connect(admin).connectLendingPool(lendingPool.address);

  // Get and deploy CollateralManager contract
  const CollateralManager = await hre.ethers.getContractFactory('CollateralManager');
  const collateralManager = await CollateralManager.deploy(
    configurator.address,
    lendingPool.address
  );
  await collateralManager.deployed();
  console.log("CollateralManager deployed to:", collateralManager.address);
  fileData += `REACT_APP_COLLATERAL_MANAGER_CONTRACT_ADDRESS=${collateralManager.address}\n`;

  // Connect CollateralManager in Configurator
  await configurator.connect(admin).connectCollateralManager(
      collateralManager.address
  );

  // Link CollateralManager to LendingPool
  await configurator.connect(admin).connectLendingPoolCollateralManager();

  // Get and deploy OraceTokenPrice
  TokenPriceOracle = await ethers.getContractFactory('TokenPriceOracle');
  tokenPriceOracle = await TokenPriceOracle.deploy();

  // Get and deploy AssetToken contracts
  const assetTokenSupply = hre.ethers.utils.parseEther("5000000.0");
  const assetTokenInitialBalance = hre.ethers.utils.parseEther("150000.0");
  const assetTokenInitialBalanceWETH = hre.ethers.utils.parseEther("200.0");
  const AssetToken = await hre.ethers.getContractFactory('AssetToken');
  // DAI:
  assetTokenDAI = await AssetToken.connect(admin).deploy('DAI Token', 'DAI', assetTokenSupply);
  await assetTokenDAI.deployed();
  console.log("assetTokenDAI deployed to:", assetTokenDAI.address);
  fileData += `REACT_APP_ASSET_TOKEN_DAI_CONTRACT_ADDRESS=${assetTokenDAI.address}\n`;
  // USDC:
  assetTokenUSDC = await AssetToken.connect(admin).deploy('USDC Token', 'USDC', assetTokenSupply);
  await assetTokenUSDC.deployed();
  console.log("assetTokenUSDC deployed to:", assetTokenUSDC.address);
  fileData += `REACT_APP_ASSET_TOKEN_USDC_CONTRACT_ADDRESS=${assetTokenUSDC.address}\n`;
  // WETH:
  assetTokenWETH = await AssetToken.connect(admin).deploy('WETH Token', 'WETH', assetTokenSupply);
  await assetTokenWETH.deployed();
  console.log("assetTokenWETH deployed to:", assetTokenWETH.address);
  fileData += `REACT_APP_ASSET_TOKEN_WETH_CONTRACT_ADDRESS=${assetTokenWETH.address}\n`;
  
  // Get and deploy nToken contracts
  NToken = await hre.ethers.getContractFactory('NToken');
  // DAI:
  nTokenDAI = await NToken.connect(admin).deploy(
    configurator.address,
    lendingPool.address,
    'DAI nToken', 
    'nDAI'
  );
  await nTokenDAI.deployed();
  console.log("nTokenDAI deployed to:", nTokenDAI.address);
  fileData += `REACT_APP_N_TOKEN_DAI_CONTRACT_ADDRESS=${nTokenDAI.address}\n`;
  // USDC:
  nTokenUSDC = await NToken.connect(admin).deploy(
    configurator.address,
    lendingPool.address,
    'USDC nToken', 
    'nUSDC'
  );
  await nTokenUSDC.deployed();
  console.log("nTokenUSDC deployed to:", nTokenUSDC.address);
  fileData += `REACT_APP_N_TOKEN_USDC_CONTRACT_ADDRESS=${nTokenUSDC.address}\n`;
  // WETH:
  nTokenWETH = await NToken.connect(admin).deploy(
    configurator.address,
    lendingPool.address,
    'WETH nToken', 
    'nWETH'
  );
  await nTokenWETH.deployed();
  console.log("nTokenWETH deployed to:", nTokenWETH.address);
  fileData += `REACT_APP_N_TOKEN_WETH_CONTRACT_ADDRESS=${nTokenWETH.address}\n`;

  // Get and deploy debtToken contracts
  DebtToken = await hre.ethers.getContractFactory('DebtToken');
  // DAI:
  debtTokenDAI = await DebtToken.connect(admin).deploy(
    configurator.address,
    lendingPool.address,
    'DAI debtToken', 
    'debtDAI'
  );
  await debtTokenDAI.deployed();  
  console.log("debtTokenDAI deployed to:", debtTokenDAI.address);
  fileData += `REACT_APP_DEBT_TOKEN_DAI_CONTRACT_ADDRESS=${debtTokenDAI.address}\n`;
  // USDC:
  debtTokenUSDC = await DebtToken.connect(admin).deploy(
    configurator.address,
    lendingPool.address,
    'USDC debtToken', 
    'debtUSDC'
  );
  await debtTokenUSDC.deployed();  
  console.log("debtTokenUSDC deployed to:", debtTokenUSDC.address);
  fileData += `REACT_APP_DEBT_TOKEN_USDC_CONTRACT_ADDRESS=${debtTokenUSDC.address}\n`;
  // WETH:
  debtTokenWETH = await DebtToken.connect(admin).deploy(
    configurator.address,
    lendingPool.address,
    'WETH debtToken', 
    'debtWETH'
  );
  await debtTokenWETH.deployed();  
  console.log("debtTokenWETH deployed to:", debtTokenWETH.address);
  fileData += `REACT_APP_DEBT_TOKEN_WETH_CONTRACT_ADDRESS=${debtTokenWETH.address}\n`;

  // Initialize Reserves
  // DAI:
  await configurator.connect(admin).initLendingPoolReserve(assetTokenDAI.address, nTokenDAI.address, debtTokenDAI.address);
  // USDC:
  await configurator.connect(admin).initLendingPoolReserve(assetTokenUSDC.address, nTokenUSDC.address, debtTokenUSDC.address);
  // WETH:
  await configurator.connect(admin).initLendingPoolReserve(assetTokenWETH.address, nTokenWETH.address, debtTokenWETH.address);
  console.log('Initialized Reserves');

  // Get and deploy NFT contracts
  NFT = await hre.ethers.getContractFactory('NFT');
  // PUNK:
  nftPUNK = await NFT.connect(admin).deploy('Cryptopunks', 'PUNK');
  await nftPUNK.deployed();
  console.log("NFT PUNK deployed to:", nftPUNK.address);
  fileData += `REACT_APP_NFT_PUNK_CONTRACT_ADDRESS=${nftPUNK.address}\n`;
  // BAYC:
  nftBAYC = await NFT.connect(admin).deploy('Bored Ape Yacht Club', 'BAYC');
  await nftBAYC.deployed();
  console.log("NFT BAYC deployed to:", nftBAYC.address);
  fileData += `REACT_APP_NFT_BAYC_CONTRACT_ADDRESS=${nftBAYC.address}`;

  // Set NFT liquidation thresholds
  await configurator.connect(admin).setCollateralManagerLiquidationThreshold(nftPUNK.address, 150); // in percent
  await configurator.connect(admin).setCollateralManagerLiquidationThreshold(nftBAYC.address, 150); // in percent

  // Whitelist NFT
  await configurator.connect(admin).updateCollateralManagerWhitelist(nftPUNK.address, true);
  await configurator.connect(admin).updateCollateralManagerWhitelist(nftBAYC.address, true);

  // Set NFT-specific APRs
  await configurator.connect(admin).setCollateralManagerInterestRate(nftPUNK.address, 18);
  await configurator.connect(admin).setCollateralManagerInterestRate(nftBAYC.address, 20);

  // Set Mocked Oracle NFT prices
  let mockFloorPrice;
  mockFloorPrice = ethers.utils.parseUnits('100', 18);
  await lendingPool.setMockFloorPrice(nftPUNK.address, mockFloorPrice);
  mockFloorPrice = ethers.utils.parseUnits('60', 18);
  await lendingPool.setMockFloorPrice(nftBAYC.address, mockFloorPrice);

  // Set Mock Oracle Asset Token prices
  const mockETHDAI = ethers.utils.parseUnits('4325.37', 18);
  const mockETHUSDC = ethers.utils.parseUnits('4332.14', 18);
  const mockETHWETH = ethers.utils.parseUnits('1', 18);
  await lendingPool.setMockEthTokenPrice(assetTokenDAI.address, mockETHDAI);  
  await lendingPool.setMockEthTokenPrice(assetTokenUSDC.address, mockETHUSDC); 
  await lendingPool.setMockEthTokenPrice(assetTokenWETH.address, mockETHWETH);  

  // Writes fileData to interface ../interface/.env 
  await writeContractAddressesToInterfaceEnv(fileData);

  /* 
  
  2. Transfer Asset Tokens and NFTs to accounts 0, 1 and 2.
  */


  // Transfer funds to acc0, acc1 and acc2
  const accDict = {0: acc0, 1: acc1, 2: acc2}
  const tokenDict = {
    "DAI": assetTokenDAI.address,
    "USDC": assetTokenUSDC.address,
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
  }
  await transfer(0, assetTokenDAI);
  await transfer(0, assetTokenUSDC);
  await transfer(0, assetTokenWETH);
  await transfer(1, assetTokenDAI);
  await transfer(1, assetTokenUSDC);
  await transfer(1, assetTokenWETH);
  await transfer(2, assetTokenDAI);
  await transfer(2, assetTokenUSDC);
  await transfer(2, assetTokenWETH);

  // Mint NFTs to acc1 and acc2
  const nftDict = {"PUNK": nftPUNK, "BAYC": nftBAYC}
  async function mint(nftName, accNum, tokenId) {
    const nft = nftDict[nftName];
    const acc = accDict[accNum];
    await nft.mint(acc.address, tokenId);
    console.log(`${nftName} #${tokenId} minted to acc${accNum} (address: ${acc.address})`)
  }
  // PUNK:
  await mint("PUNK", 0, 0);
  await mint("PUNK", 0, 1);
  await mint("PUNK", 1, 2);
  await mint("PUNK", 1, 3);
  await mint("PUNK", 2, 4);
  await mint("PUNK", 2, 5);
  // BAYC: 
  await mint("BAYC", 0, 0);
  await mint("BAYC", 0, 1);
  await mint("BAYC", 1, 2);
  await mint("BAYC", 1, 3);
  await mint("BAYC", 2, 4);
  await mint("BAYC", 2, 5); 

  /* 
  
  3. Create deposits and borrows (including defaulted borrows) from accounts 2 and 3.
  */

  // Deposits from Account 1
  let depositAmount; 
  depositAmount = hre.ethers.utils.parseEther("150000");
  await assetTokenDAI.connect(acc1).approve(lendingPool.address, depositAmount);
  await lendingPool.connect(acc1).deposit(assetTokenDAI.address, depositAmount);

  depositAmount = hre.ethers.utils.parseEther("150000");
  await assetTokenUSDC.connect(acc1).approve(lendingPool.address, depositAmount);
  await lendingPool.connect(acc1).deposit(assetTokenUSDC.address, depositAmount);

  depositAmount = hre.ethers.utils.parseEther("200.00");
  await assetTokenWETH.connect(acc1).approve(lendingPool.address, depositAmount);
  await lendingPool.connect(acc1).deposit(assetTokenWETH.address, depositAmount);

  // Prepopulate borrows
  let borrowAmount;
  let tokenId;
  let numWeeks;
  // Borrows from Account 0
  borrowAmount = "50";
  tokenId = 1;
  numWeeks = 0;
  borrowAmount = hre.ethers.utils.parseEther(borrowAmount);
  await nftPUNK.connect(acc0).approve(collateralManager.address, tokenId);
  console.log('lendingPool.address', lendingPool.address);
  console.log('assetTokenWETH.address', assetTokenWETH.address);
  console.log('nftPUNK.address', nftPUNK.address);
  await lendingPool.connect(acc0).borrow(
    assetTokenWETH.address,
    borrowAmount,
    nftPUNK.address,
    tokenId,
    numWeeks
  );

  // Borrows from Account 1
  borrowAmount = "42";
  tokenId = 3;
  numWeeks = 0;
  borrowAmount = hre.ethers.utils.parseEther(borrowAmount);
  await nftPUNK.connect(acc1).approve(collateralManager.address, tokenId);
  console.log('lendingPool.address', lendingPool.address);
  console.log('assetTokenWETH.address', assetTokenWETH.address);
  console.log('nftPUNK.address', nftPUNK.address);
  await lendingPool.connect(acc1).borrow(
    assetTokenWETH.address,
    borrowAmount,
    nftPUNK.address,
    tokenId,
    numWeeks
  );

  // borrowAmount = hre.ethers.utils.parseEther("30")
  // await nftPUNK.connect(acc2).approve(collateralManager.address, 5);
  // await lendingPool.connect(acc2).borrow(
  //   assetTokenWETH.address,
  //   borrowAmount,
  //   nftPUNK.address,
  //   5,
  //   2
  // )

  // borrowAmount = hre.ethers.utils.parseEther("30")
  // await nftBAYC.connect(acc2).approve(collateralManager.address, 4);
  // await lendingPool.connect(acc2).borrow(
  //   assetTokenWETH.address,
  //   borrowAmount,
  //   nftBAYC.address,
  //   4,
  //   26
  // )

  // borrowAmount = hre.ethers.utils.parseEther("20")
  // await nftBAYC.connect(acc2).approve(collateralManager.address, 5);
  // await lendingPool.connect(acc2).borrow(
  //   assetTokenWETH.address,
  //   borrowAmount,
  //   nftBAYC.address,
  //   5,
  //   13
  // )

  // // Update Mocked Oracle NFT prices - to put half in default
  // mockFloorPrice = ethers.utils.parseUnits('80', 18);
  // lendingPool.setMockFloorPrice(nftPUNK.address, mockFloorPrice);
  // mockFloorPrice = ethers.utils.parseUnits('50', 18);
  // lendingPool.setMockFloorPrice(nftBAYC.address, mockFloorPrice);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});