const { expect, util } = require('chai');
const { ethers } = require('hardhat');

let LendingPool;
let hhLendingPool;
let hhLendingPoolAddress;
let CollateralManager;
let hhCollateralManager;
let hhCollateralManagerAddress;
let TokenPriceConsumer;
let hhTokenPriceConsumer;
let hhTokenPriceConsumerAddress;
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
    TokenPriceConsumer = await ethers.getContractFactory('TokenPriceConsumer');
    hhTokenPriceConsumer = await TokenPriceConsumer.deploy("0xAa7F6f7f507457a1EE157fE97F6c7DB2BEec5cD0");
    hhTokenPriceConsumerAddress = await hhTokenPriceConsumer.resolvedAddress;

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
    .setCollateralManagerInterestRate(hhNFT.address, hhAssetToken.address, ethers.utils.parseUnits(interestRate.toString(), 25)); // in RAY 1e27/100 for percentage

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

    // Get and deploy NFT Price Oracle
    NFTPriceConsumer = await ethers.getContractFactory('NFTPriceConsumer');
    hhNFTPriceConsumer = await NFTPriceConsumer.deploy(hhConfiguratorAddress, 5);
    await hhNFTPriceConsumer.deployed();
    hhNFTPriceConsumerAddress = await hhNFTPriceConsumer.resolvedAddress;
    await hhConfigurator.connectNFTPriceConsumer(hhNFTPriceConsumer.address);
    await hhConfigurator.connectLendingPoolContract("NFT_PRICE_ORACLE");

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

    // Set/Mock NFT Price Oracle NFT price
    const mockFloorPrice = ethers.utils.parseUnits('100', 18);
    await hhConfigurator
        .connect(admin)
        .setNFTPriceConsumerFloorPrice(hhNFT.address, mockFloorPrice); 
});

async function initReserve() {
    return hhConfigurator
    .connect(admin)
    .initLendingPoolReserve(
        hhNFT.address,
        hhAssetToken.address, 
        hhFToken.address,
        hhDebtToken.address,
        "WETH"
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

async function borrow(signer, nftToken, tokenId, assetToken, tokenAmount, isCreate=True) {
    // Approve NFT transfer
    if (isCreate) {
        await nftToken.connect(signer).approve(hhCollateralManagerAddress, tokenId);
    }
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

describe('LendingPool >> Borrow', function() {
    
    it('should check NFT balances', async function () {
        await expect(
            (await hhNFT.balanceOf(alice.address)))
            .to.equal(1);
        await expect(
            (await hhNFT.balanceOf(bob.address)))
            .to.equal(1);
    });

    it('should check NFT tokenId ownership', async function () {
        await expect(
            (await hhNFT.ownerOf(alice_tokenId)))
            .to.equal(alice.address);
        await expect(
            (await hhNFT.ownerOf(bob_tokenId)))
            .to.equal(bob.address);    
    });

    it('should create borrow, escrow NFT, release tokens and create debt', async function() {
        const depositAmount = ethers.utils.parseUnits('4', 18); 
        const borrowAmount = ethers.utils.parseUnits('2', 18); 
        const liquidityIndex = ethers.utils.parseUnits('1.000000006341958396752917300', 27);

        // Initialize reserve
        await initReserve();

        // Deposit Asset tokens [required for liquidity]
        await deposit(alice, hhNFT.address, hhAssetToken, depositAmount);
        
        // Expect: Borrow Emit response
        await expect(
            borrow(bob, hhNFT, bob_tokenId, hhAssetToken, borrowAmount))
            .to.emit(hhLendingPool, 'Borrow')
            .withArgs(
                hhAssetToken.address,
                borrowAmount,
                hhNFT.address,
                bob_tokenId,
                bob.address, 
                liquidityIndex);

        // Expect: NFT to be held in Escrow
        await expect(
            (await hhNFT.ownerOf(bob_tokenId)))
            .to.equal(hhCollateralManagerAddress);

        // Expect: assetTokens transferred to bob
        await expect(
            (await hhAssetToken.balanceOf(bob.address)))
            .to.equal(hhAssetTokenInitialBalance.add(borrowAmount));

        // Expect: assetTokens transferred to bob
        await expect(
            (await hhDebtToken.balanceOf(bob.address)))
            .to.equal(borrowAmount);
    });

    it('should correctly update the liquidity index', async function() {
        const depositAmount = 2;
        const borrowAmount = 1;

        const depositAmountWad = ethers.utils.parseUnits('2', 18); 
        const borrowAmountWad = ethers.utils.parseUnits('1', 18); 

        // Calculate Liquidity Index
        prevLiquidityIndex = ethers.utils.parseUnits('1', 27);
        timeDelta = 2;
        
        // Initialize reserve
        await initReserve();

        // Deposit Asset tokens [required for liquidity]
        await deposit(alice, hhNFT.address, hhAssetToken, depositAmountWad);

        const utilizationRate = ethers.utils.parseUnits((borrowAmountWad / depositAmountWad).toString(), 27); 
        //** const borrowRate = ethers.utils.parseUnits(interestRate.toString(), 25); // 20% to 27dp
        const liquidityRate = utilizationRate.mul(interestRate).div(100); // **using interestRate.div(100) as a proxy for borrowRate without the decimals
        const liquidityIndex = (prevLiquidityIndex.mul(liquidityRate).div(ethers.utils.parseUnits('1', 27)).mul(timeDelta).div(365).div(24).div(60).div(60)).add(prevLiquidityIndex);

        // Expect: Borrow Emit response
        await expect(
            borrow(bob, hhNFT, bob_tokenId, hhAssetToken, borrowAmountWad))
            .to.emit(hhLendingPool, 'Borrow')
            .withArgs(
                hhAssetToken.address,
                borrowAmountWad,
                hhNFT.address,
                bob_tokenId,
                bob.address,
                liquidityIndex);
    });

    it('should create borrow, and then allow for more to be borrowed against it', async function() {
        const depositAmount = ethers.utils.parseUnits('100', 18); 
        const borrowAmount = ethers.utils.parseUnits('2', 18); 
        const liquidityIndex = ethers.utils.parseUnits('1.000000050735669587249523954', 27);
        const borrowAmount2 = ethers.utils.parseUnits('4.000000012683916794', 18);
        const borrowAmount3 = ethers.utils.parseUnits('70', 18); 

        // Initialize reserve
        await initReserve();

        // Deposit Asset tokens [required for liquidity]
        await deposit(alice, hhNFT.address, hhAssetToken, depositAmount);
        
        console.log('borrow1');
        // Expect: Borrow Emit response
        await borrow(bob, hhNFT, bob_tokenId, hhAssetToken, borrowAmount, true)

        // Expect: NFT to be held in Escrow
        await expect(
            (await hhNFT.ownerOf(bob_tokenId)))
            .to.equal(hhCollateralManagerAddress);

        // Expect: assetTokens transferred to bob
        await expect(
            (await hhAssetToken.balanceOf(bob.address)))
            .to.equal(hhAssetTokenInitialBalance.add(borrowAmount));

        // Expect: assetTokens transferred to bob
        await expect(
            (await hhDebtToken.balanceOf(bob.address)))
            .to.equal(borrowAmount);

        console.log('borrow2');
        console.log('bob.address', bob.address);
        // Expect: Borrow Emit response
        await expect(
            borrow(bob, hhNFT, bob_tokenId, hhAssetToken, borrowAmount, false))
            .to.emit(hhLendingPool, 'Borrow')

        // Expect: assetTokens transferred to bob
        await expect(
            (await hhDebtToken.balanceOf(bob.address)))
            .to.equal(borrowAmount2);

        await expect(
            borrow(bob, hhNFT, bob_tokenId, hhAssetToken, borrowAmount3, false))
            .to.be.revertedWith('UNDERCOLLATERALIZED');
            
    });
});
