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
    hhAssetTokenAddress = await hhAssetToken.resolvedAddress;
    
    // Get and deploy NFT
    NFT = await ethers.getContractFactory('NFT');
    hhNFT = await NFT.deploy('Punk NFT', 'PUNK');
    await hhNFT.deployed();

    // Get and deploy fToken
    FToken = await ethers.getContractFactory('FToken');
    hhFToken = await FToken.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
        treasury.address,
        hhNFT.address,
        hhAssetTokenAddress,
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

    // // Transfer funds to alice and bob
    // await hhAssetToken.transfer(alice.address, hhAssetTokenInitialBalance.toString());
    // await hhAssetToken.transfer(bob.address, hhAssetTokenInitialBalance.toString());


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

describe('FToken >> LendingPool >> Init', function() {

    it('should init reserve', async function () {

        // Initialize reserve
        async function _initReserve() {
            return initReserve();
        }

        // Expect: InitReserve Emit response
        await expect(
            _initReserve())
            .to.emit(hhLendingPool, 'InitReserve')
            .withArgs(
                hhNFT.address,
                hhAssetToken.address, 
                hhFToken.address,
                hhDebtToken.address);
    });
});

describe('FToken', function() {
    let liquidityIndex = ethers.utils.parseUnits('1', 27); 

    let amount = ethers.utils.parseUnits('4', 18);
    let amountDivliquidityIndex = ethers.utils.parseUnits('4', 18); 
    
    // NOTE: comment-out function modifier "onlyLendingPool" to run 
    it('should mint fTokens', async function () {
        await initReserve();
        await expect(hhFToken.connect(lendingPool).mint(alice.address, amount, liquidityIndex))
        .to.emit(hhFToken, 'Mint')
        .withArgs(alice.address, amount, amountDivliquidityIndex);

        let newBalance = await hhFToken.balanceOf(alice.address);
        await expect(newBalance).to.equal(amount);
    }) 

    // NOTE: comment-out function modifier "onlyLendingPool" to run 
    it('should burn fTokens', async function () {
        await initReserve();

        await hhFToken.connect(lendingPool).mint(lendingPool.address, amount, liquidityIndex);
        
        await expect(hhFToken.connect(lendingPool).burn(amount, liquidityIndex))
        .to.emit(hhFToken, 'Burn')
        .withArgs(lendingPool.address, amount, amountDivliquidityIndex);

        let newBalance = await hhFToken.balanceOf(alice.address);
        await expect(newBalance).to.equal(amount.sub(amount));
    });

    // NOTE: comment-out function modifier "onlyLendingPool" to run 
    it('should burn fTokens from alice', async function () {
        let liquidityIndex = ethers.utils.parseUnits('1', 27); 
        let amount = ethers.utils.parseUnits('4.5', 18);
        let amountDivliquidityIndex = ethers.utils.parseUnits('4.5', 18); 

        await initReserve();

        await hhFToken.mint(alice.address, amount, liquidityIndex);
        
        let balanceBefore = await hhFToken.balanceOf(alice.address);
        await hhFToken.connect(alice).approve(alice.address, amount);
        await expect(hhFToken.connect(alice).burnFrom(alice.address, amount, liquidityIndex))
        .to.emit(hhFToken, 'Burn')
        .withArgs(alice.address, amount, amountDivliquidityIndex);

        let balanceAfter = await hhFToken.balanceOf(alice.address);

        await expect(balanceAfter).to.equal(balanceBefore.sub(amount));

    });

    // NOTE: comment-out function modifier "onlyLendingPool" to run 
    it('should update the total supply', async function () {
        let liquidityIndex = ethers.utils.parseUnits('1', 27); 
        let amount = ethers.utils.parseUnits('4.5', 18);

        await initReserve();

        await hhFToken.mint(alice.address, amount, liquidityIndex);

        let totalSupplyBefore = await hhFToken.totalSupply();

        await hhFToken.connect(alice).approve(alice.address, amount);
        await hhFToken.connect(alice).burnFrom(alice.address, amount, liquidityIndex);
        
        let totalSupplyAfter = await hhFToken.totalSupply()
        await expect(totalSupplyAfter).to.equal(totalSupplyBefore.sub(amount));
    });

    // NOTE: will fail due to the reserve not being innitialized. 
    // Copy this line to set liquidityIndex to 1 Ray and run the test
    // uint256 liquidityIndex = WadRayMath.ray();
    it('should transfer tokens', async function () {
        let liquidityIndex = ethers.utils.parseUnits('1', 27); 
        let amount = ethers.utils.parseUnits('4.5', 18);

        await initReserve();

        await hhFToken.connect(lendingPool).mint(alice.address, amount, liquidityIndex);
        await hhFToken.connect(alice).approve(bob.address, amount);
        await expect(hhFToken.connect(lendingPool).transferBalance(alice.address, bob.address, amount))
        .to.emit(hhFToken, 'BalanceTransfer')
        .withArgs(alice.address, bob.address, amount, liquidityIndex);
    });
})