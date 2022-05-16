const { expect } = require('chai');
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

async function borrow(signer, nftToken, tokenId, assetToken, tokenAmount) {
    // Approve NFT transfer
    await nftToken.connect(signer).approve(hhCollateralManagerAddress, tokenId);
    return hhLendingPool.connect(signer).borrow(
        assetToken.address,
        tokenAmount,
        nftToken.address,
        tokenId);
}

async function repay(signer, assetToken, fToken, repaymentAmount, borrowId) {
    // Approve transfer of repaymentAmount asset tokens to fToken address (asset reserve)
    await assetToken.connect(signer).approve(fToken.address, repaymentAmount);
    return hhLendingPool.connect(signer).repay(
        assetToken.address,
        repaymentAmount,
        borrowId);
}

async function liquidate(signer, assetToken, liquidationAmount, borrowId) {
    // Approve transfer of liquidationAmount asset tokens to lendingPool address)
    await assetToken.connect(signer).approve(hhLendingPoolAddress, liquidationAmount);
    return hhLendingPool.connect(signer).liquidate(
        assetToken.address,
        liquidationAmount,
        borrowId);
}
    
describe('LendingPool >> Withdraw', function() {

    it('should withdraw tokens from the FToken reserve', async function () {
        const tokenAmount = ethers.utils.parseUnits('2', 18);
        const withdrawAmount = ethers.utils.parseUnits('1', 18);
        const initialLiquidityIndex = ethers.utils.parseUnits('1', 27);

        // Initialize reserve
        await initReserve();

        // Deposit asset tokens
        deposit(alice, hhNFT.address, hhAssetToken, tokenAmount);

        // Withdraw Asset tokens
        async function _withdraw(signer, collateralAddress, assetToken, fToken, _tokenAmount) {
            return withdraw(signer, collateralAddress, assetToken, fToken, _tokenAmount);
        }

        // Expect: Withdraw Emit response
        await expect(
            _withdraw(alice, hhNFT.address, hhAssetToken, hhFToken, withdrawAmount))
            .to.emit(hhLendingPool, 'Withdraw')
            .withArgs(
                hhNFT.address,
                hhAssetToken.address,
                withdrawAmount,
                alice.address,
                initialLiquidityIndex);

    });

    it('should transfer assetTokens from hhFToken contract to alice', async function () {
        const tokenAmount = ethers.utils.parseUnits('2', 18);
        const withdrawAmount = ethers.utils.parseUnits('1', 18);
        const initialLiquidityIndex = ethers.utils.parseUnits('1', 27);

        // Initialize reserve
        await initReserve();

        // Deposit Asset tokens
        await deposit(alice, hhNFT.address, hhAssetToken, tokenAmount)

        // Withdraw asset tokens
        await withdraw(alice, hhNFT.address, hhAssetToken, hhFToken, withdrawAmount)

        // Expect: assetTokens transfered from hhNToken contract to alice
        await expect(
            (await hhAssetToken.balanceOf(alice.address)))
            .to.equal(hhAssetTokenInitialBalance.sub(tokenAmount.sub(withdrawAmount)));

        await expect(
            (await hhAssetToken.balanceOf(hhFToken.address)))
            .to.equal(tokenAmount.sub(withdrawAmount));
    });

    it('should burn fTokens from alice', async function () {            
        const tokenAmount = ethers.utils.parseUnits('2', 18);
        const withdrawAmount = ethers.utils.parseUnits('1', 18);
        const initialLiquidityIndex = ethers.utils.parseUnits('1', 27);

        // Initialize reserve
        await initReserve();

        // Deposit Asset tokens
        await deposit(alice, hhNFT.address, hhAssetToken, tokenAmount)

        // Withdraw asset tokens
        await withdraw(alice, hhNFT.address, hhAssetToken, hhFToken, withdrawAmount)

        // Expect: fTokens burnedFrom alice
        await expect(
            (await hhFToken.balanceOf(alice.address)))
            .to.equal(tokenAmount.sub(withdrawAmount));
    });

    it('should update liquidity index', async function () {            
        const tokenAmount = ethers.utils.parseUnits('3', 18);//1*10**numDecimals;
        const borrowAmount = ethers.utils.parseUnits('2', 18);
        const withdrawAmount = ethers.utils.parseUnits('1', 18);
        const updatedLiquidityIndex = "1000000021139861537018718872";

        // Initialize reserve
        await initReserve();

        // Deposit Asset tokens
        await deposit(alice, hhNFT.address, hhAssetToken, tokenAmount)

        // Borrow Asset tokens
        await borrow(bob, hhNFT, bob_tokenId, hhAssetToken, borrowAmount);

        // Expect updated liquidity Index
        await expect(
            withdraw(alice, hhNFT.address, hhAssetToken, hhFToken, withdrawAmount))
            .to.emit(hhLendingPool, 'Withdraw')
            .withArgs(
                hhNFT.address,
                hhAssetToken.address,
                withdrawAmount,
                alice.address,
                updatedLiquidityIndex);
    });

    it('should update scaledUserBalance and fToken Balance', async function() {
        const depositAmount = ethers.utils.parseUnits('3', 18);
        const withdrawAmount = ethers.utils.parseUnits('2', 18);
        const borrowAmount = ethers.utils.parseUnits('1', 18); 
        const updatedScaledBalance = "1000000008455944493";
        const updatedBalance = "1000000025367833801"; // updatedBalance > updatedScaledBalance

        // Initialize reserve
        await initReserve();

        // Deposit Asset tokens
        await deposit(alice, hhNFT.address, hhAssetToken, depositAmount)

        // Borrow Asset tokens
        await borrow(bob, hhNFT, bob_tokenId, hhAssetToken, borrowAmount)

        // Withdraw asset tokens
        await withdraw(alice, hhNFT.address, hhAssetToken, hhFToken, withdrawAmount);

        await expect(await hhFToken.scaledBalanceOf(alice.address)).to.equal(updatedScaledBalance);
        await expect(await hhFToken.balanceOf(alice.address)).to.equal(updatedBalance);
    });
});
