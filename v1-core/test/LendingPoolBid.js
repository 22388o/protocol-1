const { expect, util } = require('chai');
const { ethers } = require('hardhat');

let LendingPool;
let hhLendingPool;
let hhLendingPoolAddress;
let CollateralManager;
let hhCollateralManager;
let hhCollateralManagerAddress;
let TokenPriceOracle;
let hhTokenPriceOracle;
let hhTokenPriceOracleAddress;
let AssetToken;
let hhAssetToken;
let hhAssetTokenSupply;
let FToken;
let hhFToken;
let DebtToken;
let hhDebtToken;
let admin;
let emergencyAdmin;
let alice;
let bob;
let alice_tokenId;
let bob_tokenId;
let liquidationThreshold = 150;
let interestRate = 20;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

beforeEach(async function() {
    numDecimals = 10; // set lower than 18 due to ether.js issue
    hhAssetTokenSupply = ethers.utils.parseUnits('10000000', 18); //3*10**numDecimals;
    hhAssetTokenInitialBalance = ethers.utils.parseUnits('1000000', 18);
    alice_tokenId = 0;
    bob_tokenId = 1;

    // Get Signers
    [admin, emergencyAdmin, alice, bob, treasury] = await ethers.getSigners();

    // Get and deploy Configurator
    Configurator = await ethers.getContractFactory('Configurator');
    hhConfigurator = await Configurator.deploy(
        emergencyAdmin.address,
        admin.address 
    );
    await hhConfigurator.deployed();
    hhConfiguratorAddress = await hhConfigurator.resolvedAddress;

    // Get and deploy OraceTokenPrice
    TokenPriceOracle = await ethers.getContractFactory('TokenPriceOracle');
    hhTokenPriceOracle = await TokenPriceOracle.deploy();
    hhTokenPriceOracleAddress = await hhTokenPriceOracle.resolvedAddress;

    // Get and deploy LendingPool
    LendingPool = await ethers.getContractFactory('LendingPool');
    hhLendingPool = await LendingPool.deploy(
        hhConfiguratorAddress,
        treasury.address
    );
    await hhLendingPool.deployed();
    hhLendingPoolAddress = await hhLendingPool.resolvedAddress;

    // Connect Configurator to LendingPool by setting the address
    await hhConfigurator.connectLendingPool(hhLendingPoolAddress);

    // Get, deploy and connect LendingPoolBorrow ti LendingPool
    LendingPoolBorrow = await ethers.getContractFactory('LendingPoolBorrow');
    hhLendingPoolBorrow = await LendingPoolBorrow.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
    );
    await hhLendingPoolBorrow.deployed();
    hhLendingPoolBorrowAddress = await hhLendingPoolBorrow.resolvedAddress;
    await hhConfigurator.connectLendingPoolBorrow(hhLendingPoolBorrowAddress);
    await hhConfigurator.connectLendingPoolContract("BORROW");

    // Get, deploy and connect LendingPoolDeposit to LendingPool
    LendingPoolDeposit = await ethers.getContractFactory('LendingPoolDeposit');
    hhLendingPoolDeposit = await LendingPoolDeposit.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
    );
    await hhLendingPoolDeposit.deployed();
    hhLendingPoolDepositAddress = await hhLendingPoolDeposit.resolvedAddress;
    await hhConfigurator.connectLendingPoolDeposit(hhLendingPoolDepositAddress);
    await hhConfigurator.connectLendingPoolContract("DEPOSIT");

    // Get, deploy and connect LendingPoolBid to LendingPool
    LendingPoolBid = await ethers.getContractFactory('LendingPoolBid');
    hhLendingPoolBid = await LendingPoolBid.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
    );
    await hhLendingPoolBid.deployed();
    hhLendingPoolBidAddress = await hhLendingPoolBid.resolvedAddress;
    await hhConfigurator.connectLendingPoolBid(hhLendingPoolBidAddress);
    await hhConfigurator.connectLendingPoolContract("BID");

    // Get, deploy and connect LendingPoolRedeem to LendingPool
    LendingPoolRedeem = await ethers.getContractFactory('LendingPoolRedeem');
    hhLendingPoolRedeem = await LendingPoolRedeem.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
    );
    await hhLendingPoolRedeem.deployed();
    hhLendingPoolRedeemAddress = await hhLendingPoolRedeem.resolvedAddress;
    await hhConfigurator.connectLendingPoolRedeem(hhLendingPoolRedeemAddress);
    await hhConfigurator.connectLendingPoolContract("REDEEM");

    // Get, deploy and connect LendingPoolLiquidate to LendingPool
    LendingPoolLiquidate = await ethers.getContractFactory('LendingPoolLiquidate');
    hhLendingPoolLiquidate = await LendingPoolLiquidate.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
    );
    await hhLendingPoolLiquidate.deployed();
    hhLendingPoolLiquidateAddress = await hhLendingPoolLiquidate.resolvedAddress;
    await hhConfigurator.connectLendingPoolLiquidate(hhLendingPoolLiquidateAddress);
    await hhConfigurator.connectLendingPoolContract("LIQUIDATE");

    // Get, deploy and connect LendingPoolRepay to LendingPool
    LendingPoolRepay = await ethers.getContractFactory('LendingPoolRepay');
    hhLendingPoolRepay = await LendingPoolRepay.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
    );
    await hhLendingPoolRepay.deployed();
    hhLendingPoolRepayAddress = await hhLendingPoolRepay.resolvedAddress;
    await hhConfigurator.connectLendingPoolRepay(hhLendingPoolRepayAddress);
    await hhConfigurator.connectLendingPoolContract("REPAY");

    // Get, deploy and connect LendingPoolWithdraw to LendingPool
    LendingPoolWithdraw = await ethers.getContractFactory('LendingPoolWithdraw');
    hhLendingPoolWithdraw = await LendingPoolWithdraw.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
    );
    await hhLendingPoolWithdraw.deployed();
    hhLendingPoolWithdrawAddress = await hhLendingPoolWithdraw.resolvedAddress;
    await hhConfigurator.connectLendingPoolWithdraw(hhLendingPoolWithdrawAddress);
    await hhConfigurator.connectLendingPoolContract("WITHDRAW");

    // Get and deploy CollateralManager
    CollateralManager = await ethers.getContractFactory('CollateralManager');
    hhCollateralManager = await CollateralManager.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress
        );
    await hhCollateralManager.deployed();
    hhCollateralManagerAddress = await hhCollateralManager.resolvedAddress;

    // Connect Configurator to CollateralManager
    await hhConfigurator
    .connect(admin)
    .connectCollateralManager(
        hhCollateralManagerAddress
    )

    // Link CollateralManager to LendingPool
    await hhConfigurator
    .connect(admin)
    .connectLendingPoolContract("CM");

    // Get and deploy Asset Token
    AssetToken = await ethers.getContractFactory('AssetToken');
    hhAssetToken = await AssetToken.deploy('Dai Token', 'DAI', hhAssetTokenSupply.toString());
    await hhAssetToken.deployed();
    
    // Get and deploy NFT
    NFT = await ethers.getContractFactory('NFT');
    hhNFT = await NFT.deploy('Punk NFT', 'PUNK');
    await hhNFT.deployed();

    // Whitelist NFT
    hhConfigurator
    .connect(admin)
    .updateCollateralManagerWhitelist(hhNFT.address, true);

    // Set NFT liquidation threshold
    hhConfigurator
    .connect(admin)
    .setCollateralManagerLiquidationThreshold(hhNFT.address, liquidationThreshold); // in percent

    // Set NFT interestRate threshold
    hhConfigurator
    .connect(admin)
    .setCollateralManagerInterestRate(hhNFT.address, ethers.utils.parseUnits(interestRate.toString(), 25)); // in RAY 1e27/100 for percentage

    // Get and deploy fToken
    FToken = await ethers.getContractFactory('FToken');
    hhFToken = await FToken.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
        treasury.address,
        hhNFT.address,
        hhAssetToken.address,
        'Dai fToken', 
        'fDAI');
    await hhFToken.deployed();

    // Get and deploy debtToken
    DebtToken = await ethers.getContractFactory('DebtToken');
    hhDebtToken = await DebtToken.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
        'Dai debtToken', 
        'debtDAI'
    );
    await hhDebtToken.deployed();   

    // -- Assign minter role to LendingPool
    // await hhDebtToken.setMinter(hhLendingPoolAddress);

    // -- Assign burner role to LendingPool
    // await hhDebtToken.setBurner(hhLendingPoolAddress);

    // Transfer funds to alice and bob
    await hhAssetToken.transfer(alice.address, hhAssetTokenInitialBalance.toString());
    await hhAssetToken.transfer(bob.address, hhAssetTokenInitialBalance.toString());

    // Mint NFTs to alice and bob
    await hhNFT.mint(alice.address, alice_tokenId);
    await hhNFT.mint(bob.address, bob_tokenId);

    // Set Mocked Oracle NFT price
    const mockFloorPrice = ethers.utils.parseUnits('100', 18);
    hhLendingPool.setMockFloorPrice(hhNFT.address, mockFloorPrice);

    // Set Mock Oracle Asset Token prices
    const mockETHDAI = ethers.utils.parseUnits('4325', 18);
    // const mockETHUSDC = ethers.utils.parseUnits('4332.14.', 18);
    // const mockETHWETH = ethers.utils.parseUnits('1', 18);
    hhLendingPool.setMockEthTokenPrice(hhAssetToken.address, mockETHDAI);    

    // Logging 
    // console.log('CollateralManager deployed:', hhCollateralManagerAddress);
    // console.log('LendingPoolAddress deployed:', hhLendingPoolAddress);
    // console.log('alice:', alice.address);
    // console.log('bob:', bob.address);
});

async function initReserve() {
    return hhConfigurator
    .connect(admin)
    .initLendingPoolReserve(
        hhNFT.address,
        hhAssetToken.address, 
        hhFToken.address,
        hhDebtToken.address
    )
}

async function deposit(signer, poolCollateralAddress, assetToken, tokenAmount) {
    // Approve transferFrom lendingPool 
    await assetToken.connect(signer).approve(hhLendingPoolAddress, tokenAmount);
    // Deposit in hhFToken contract reserve
    return hhLendingPool.connect(signer).deposit(poolCollateralAddress, assetToken.address, tokenAmount)
}

async function withdraw(signer, poolCollateralAddress, assetToken, fToken, _tokenAmount) {
    // Approve fToken burnFrom lendingPool 
    await fToken.connect(signer).approve(hhLendingPoolAddress, _tokenAmount);
    // Withdraw assetTokens by depositing/buring fTokens
    return hhLendingPool.connect(signer).withdraw(poolCollateralAddress, assetToken.address, _tokenAmount);
}

async function borrow(signer, nftToken, tokenId, assetToken, tokenAmount) {
    // Approve NFT transfer
    await nftToken.connect(signer).approve(hhCollateralManagerAddress, tokenId);
    return hhLendingPool.connect(signer).borrow(
        assetToken.address,
        tokenAmount,
        nftToken.address,
        tokenId);
}

async function repay(signer, collateralAddress, assetToken, fToken, repaymentAmount, borrowId) {
    // Approve transfer of repaymentAmount asset tokens to fToken address (asset reserve)
    await assetToken.connect(signer).approve(fToken.address, repaymentAmount);
    return hhLendingPool.connect(signer).repay(
        collateralAddress,
        assetToken.address,
        repaymentAmount,
        borrowId);
}

async function bid(signer, assetToken, bidAmount, borrowId) {
    // Approve transfer of bidAmount asset tokens to lendingPool address)
    await assetToken.connect(signer).approve(hhLendingPoolAddress, bidAmount);
    return hhLendingPool.connect(signer).bid(
        assetToken.address,
        bidAmount,
        borrowId);
}

async function redeem(signer, assetToken, redeemAmount, borrowId) {
    // Approve transfer of redeemAmount asset tokens to lendingPool address)
    await assetToken.connect(signer).approve(hhLendingPoolAddress, redeemAmount);
    return hhLendingPool.connect(signer).redeem(
        assetToken.address,
        liquidationAmount,
        borrowId);
}

async function liquidate(signer, collateral, asset, borrowId) {
    return hhLendingPool.connect(signer).liquidate(collateral, asset, borrowId);
}

describe('LendingPool >> Bid', function() {

    it('should fail if borrow is not in default', async function () {
        const depositAmount = ethers.utils.parseUnits('200', 18); 
        const borrowAmount = ethers.utils.parseUnits('60', 18);  
        const bidAmount = ethers.utils.parseUnits('60', 18);
        let borrowIds;
        let borrowId;

        // Initialize reserve
        await initReserve();

        // Admin: Deposits Asset tokens [required for liquidity]
        await deposit(admin, hhNFT.address, hhAssetToken, depositAmount);

        // Bob: Creates a Borrow
        await borrow(bob, hhNFT, bob_tokenId, hhAssetToken, borrowAmount);
    
        // Retrieve borrowId 
        borrowIds = await hhCollateralManager.getUserBorrowIds(bob.address);
        borrowId = borrowIds[0];

        await expect(
            bid(alice, hhAssetToken, bidAmount, borrowId)
            ).to.be.revertedWith("BORROW_NOT_IN_DEFAULT");
    });

    it('should start a liquidity auciton with an initial bid', async function () {
        const depositAmount = ethers.utils.parseUnits('200', 18); 
        const borrowAmount = ethers.utils.parseUnits('60', 18);  
        const bidAmount = ethers.utils.parseUnits('70', 18);
        let borrowIds;
        let borrowId;
        let newPrice;
        let borrowItem;

        // Initialize reserve
        await initReserve();

        // Admin: Deposits Asset tokens [required for liquidity]
        await deposit(admin, hhNFT.address, hhAssetToken, depositAmount);

        // Bob: Creates a Borrow
        await borrow(bob, hhNFT, bob_tokenId, hhAssetToken, borrowAmount);
    
        // Retrieve borrowId 
        borrowIds = await hhCollateralManager.getUserBorrowIds(bob.address);
        borrowId = borrowIds[0];

        newPrice = ethers.utils.parseUnits('80', 18);
        await hhLendingPool.setMockFloorPrice(hhNFT.address, newPrice);

        await expect(
            bid(alice, hhAssetToken, bidAmount, borrowId)
            ).to.emit(hhLendingPool, 'Bid')
            .withArgs(
                hhAssetToken.address,
                bidAmount,
                borrowId,
                alice.address
            );

        borrowItem = await hhCollateralManager.getBorrow(borrowId);

        expect(borrowItem.status).to.equal(1); //ActiveAuction
        expect(borrowItem.auction.caller).to.equal(alice.address);
        expect(borrowItem.auction.bidder).to.equal(alice.address);
        expect(borrowItem.auction.bid).to.equal(bidAmount);
        expect(borrowItem.auction.timestamp).to.be.greaterThan(borrowItem.timestamp);
    });

    it('should update from the initial bid and fail if <= existing bid', async function () {
        const depositAmount = ethers.utils.parseUnits('200', 18); 
        const borrowAmount = ethers.utils.parseUnits('60', 18);  
        const bidAmount1 = ethers.utils.parseUnits('60', 18);
        const bidAmount2 = ethers.utils.parseUnits('70', 18);
        const bidAmount3 = ethers.utils.parseUnits('70.1', 18);
        let borrowIds;
        let borrowId;
        let newPrice;
        let borrowItem;

        // Initialize reserve
        await initReserve();

        // Admin: Deposits Asset tokens [required for liquidity]
        await deposit(admin, hhNFT.address, hhAssetToken, depositAmount);

        // Bob: Creates a Borrow
        await borrow(bob, hhNFT, bob_tokenId, hhAssetToken, borrowAmount);
    
        // Retrieve borrowId 
        borrowIds = await hhCollateralManager.getUserBorrowIds(bob.address);
        borrowId = borrowIds[0];

        newPrice = ethers.utils.parseUnits('80', 18);
        await hhLendingPool.setMockFloorPrice(hhNFT.address, newPrice);

        // Admin as caller
        await bid(admin, hhAssetToken, bidAmount2, borrowId);

        // Alice has initial balance
        await expect(
             await hhAssetToken.balanceOf(alice.address))
            .to.equal(hhAssetTokenInitialBalance);

        // Makes unsuccessful bid
        await expect(
            bid(alice, hhAssetToken, bidAmount1, borrowId)
            ).to.be.revertedWith("INSUFFICIENT_BID");

        // Same balance..
        await expect(
            await hhAssetToken.balanceOf(alice.address))
            .to.equal(hhAssetTokenInitialBalance);

        await expect(
            bid(alice, hhAssetToken, bidAmount3, borrowId)
            ).to.emit(hhLendingPool, 'Bid')
            .withArgs(
                hhAssetToken.address,
                bidAmount3,
                borrowId,
                alice.address
            );
        
        // Updated balance
        await expect(
            await hhAssetToken.balanceOf(alice.address))
            .to.equal(hhAssetTokenInitialBalance.sub(bidAmount3));

        borrowItem = await hhCollateralManager.getBorrow(borrowId);

        expect(borrowItem.status).to.equal(1); //ActiveAuction
        expect(borrowItem.auction.caller).to.equal(admin.address);
        expect(borrowItem.auction.bidder).to.equal(alice.address);
        expect(borrowItem.auction.bid).to.equal(bidAmount3);
    });

    it('should revert with INSUFFICIENT_BID', async function () {
        const depositAmount = ethers.utils.parseUnits('200', 18); 
        const borrowAmount = ethers.utils.parseUnits('60', 18);  
        const bidAmount = ethers.utils.parseUnits('60', 18);
        let newPrice;
        // Initialize reserve
        await initReserve();

        // Admin: Deposits Asset tokens [required for liquidity]
        await deposit(admin, hhNFT.address, hhAssetToken, depositAmount);

        // Bob: Creates a Borrow
        await borrow(bob, hhNFT, bob_tokenId, hhAssetToken, borrowAmount);
    
        // Retrieve borrowId 
        borrowIds = await hhCollateralManager.getUserBorrowIds(bob.address);
        borrowId = borrowIds[0];

        newPrice = ethers.utils.parseUnits('80', 18);
        await hhLendingPool.setMockFloorPrice(hhNFT.address, newPrice);

        await expect(
            bid(alice, hhAssetToken, bidAmount, borrowId)
            ).to.be.revertedWith("INSUFFICIENT_BID");
    });

});
