const { expect } = require('chai');
const { ethers } = require('hardhat');

beforeEach(async function() {
    hhAssetTokenSupply = ethers.utils.parseUnits('10000000', 18); //3*10**numDecimals;
    hhAssetTokenInitialBalance = ethers.utils.parseUnits('1000000', 18);
    alice_tokenId = 0;
    bob_tokenId = 1;

    // Get Signers
    [admin, emergencyAdmin, alice, bob, lendingPool, treasury] = await ethers.getSigners();

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

    // Get and deploy debtToken
    DebtToken = await ethers.getContractFactory('DebtToken');
    hhDebtToken = await DebtToken.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
        'Dai debtToken', 
        'debtDAI'
    );
    await hhDebtToken.deployed();       
});

describe('DebtToken', function() {
    let interestRate = ethers.utils.parseUnits('2', 26); // 20% 
    let amount = ethers.utils.parseUnits('4', 18);
    let balanceIncrease = 25367833587; // Balance increase in 1-2 seconds

    // NOTE: comment-out function modifier "onlyLendingPool" to run 
    it('should mint debtTokens', async function () {
        await expect(hhDebtToken.connect(lendingPool).mint(alice.address, amount, interestRate))
        .to.emit(hhDebtToken, 'Mint')
        .withArgs(alice.address, amount, amount);
        
        await expect(hhDebtToken.connect(lendingPool).mint(alice.address, amount, interestRate))
        .to.emit(hhDebtToken, 'Mint')
        .withArgs(alice.address, amount, amount.mul(2).add(balanceIncrease));

        let newDebtBalance = await hhDebtToken.balanceOf(alice.address);
        await expect(newDebtBalance).to.equal(amount.mul(2).add(balanceIncrease));
    }) 

    // NOTE: comment-out function modifier "onlyLendingPool" to run 
    it('should burn debtTokens from alice', async function () {
        let balanceIncrease = 25367833587;
        await hhDebtToken.mint(alice.address, amount, interestRate);
        console.log('here1b');
        let balanceBefore = await hhDebtToken.balanceOf(alice.address);
        // await hhDebtToken.connect(alice).approve(alice.address, amount);

        await expect(hhDebtToken.connect(alice).burnFrom(alice.address, amount))
            .to.emit(hhDebtToken, 'Burn')
            .withArgs(alice.address, amount.sub(balanceIncrease));
        
        let balanceAfter = await hhDebtToken.balanceOf(alice.address);
      
        await expect(balanceAfter).to.equal(balanceBefore - amount + balanceIncrease); 
    });


    // NOTE: comment-out function modifier "onlyLendingPool" to run 
    it('should update the total supply', async function () {
        let balanceIncrease = 25367833748;
        await hhDebtToken.mint(alice.address, amount, interestRate);
        let totalSupplyBefore = await hhDebtToken.totalSupply();
        await hhDebtToken.connect(alice).burnFrom(alice.address, amount);
        let totalSupplyAfter = await hhDebtToken.totalSupply();

        await expect(totalSupplyAfter).to.equal(totalSupplyBefore.sub(amount).add(balanceIncrease));
    });
})