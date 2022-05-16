const { expect } = require('chai');
const { ethers } = require('hardhat');

let Configurator;
let hhConfigurator;
let hhConfiguratorAddress;
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

beforeEach(async function() {
    numDecimals = 10; // set lower than 18 due to ether.js issue
    hhAssetTokenSupply = ethers.utils.parseUnits('3', 18); //3*10**numDecimals;
    hhAssetTokenInitialBalance = ethers.utils.parseUnits('1', 18);

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

    // Get and deploy CollateralManager
    CollateralManager = await ethers.getContractFactory('CollateralManager');
    hhCollateralManager = await CollateralManager.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress
        );
    await hhCollateralManager.deployed();
    hhCollateralManagerAddress = await hhCollateralManager.resolvedAddress;

    // Get and deploy OraceTokenPrice
    TokenPriceConsumer = await ethers.getContractFactory('TokenPriceConsumer');
    hhTokenPriceConsumer = await TokenPriceConsumer.deploy("0xAa7F6f7f507457a1EE157fE97F6c7DB2BEec5cD0");
    hhTokenPriceConsumerAddress = await hhTokenPriceConsumer.resolvedAddress;

    // Get and deploy OraceTokenPrice
    NFTPriceConsumer = await ethers.getContractFactory('NFTPriceConsumer');
    hhNFTPriceConsumer = await NFTPriceConsumer.deploy(hhConfiguratorAddress, 5);
    hhNFTPriceConsumerAddress = await hhNFTPriceConsumer.resolvedAddress;

    // Get and deploy Asset Token
    AssetToken = await ethers.getContractFactory('AssetToken');
    hhAssetToken = await AssetToken.deploy('Dai Token', 'DAI', hhAssetTokenSupply.toString());
    await hhAssetToken.deployed();

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
        hhAssetToken.address,
        'Dai fToken', 
        'nDAI');
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

    // Get and deploy NFT
    NFT = await ethers.getContractFactory('NFT');
    hhNFT = await NFT.deploy('Punk NFT', 'PUNK');
    await hhNFT.deployed();
});

/* 
    -------------------------------------------------------------------------------------------
    LENDING POOL 
    ===========================================================================================

 */

describe('Configurator >> LendingPool >> pause()', function() {

    it('should pause when caller is emergency admin', async function () {
        await expect(
            hhConfigurator.connect(emergencyAdmin).pauseLendingPool()
        ).to.emit(hhLendingPool, "Paused")
    });

    it('should revert when caller is not emergency admin', async function () {
        await expect(
            hhConfigurator.connect(admin).pauseLendingPool()
        ).to.be.revertedWith("EA1");
    });
})

describe('Configurator >> LendingPool >> unpause()', function() {

    it('should unpause when caller is emergency admin', async function () {
        hhConfigurator.connect(emergencyAdmin).pauseLendingPool()
        await expect(
            hhConfigurator.connect(emergencyAdmin).unpauseLendingPool()
        ).to.emit(hhLendingPool, "Unpaused")
    });

    it('should revert when caller is not emergency admin', async function () {
        await expect(
            hhConfigurator.connect(admin).unpauseLendingPool()
        ).to.be.revertedWith("EA1");
    });
})

describe('Configurator >> LendingPool >> initReserve()', function() {
    

    it('should initialize the reserve when caller is admin', async function () {
        
        await expect(
            hhConfigurator
            .connect(admin)
            .initLendingPoolReserve(
                hhNFT.address,
                hhAssetToken.address, 
                hhFToken.address,
                hhDebtToken.address,
                "WETH"))
            .to.emit(hhLendingPool, "InitReserve")
            .withArgs(
                hhNFT.address,
                hhAssetToken.address, 
                hhFToken.address,
                hhDebtToken.address
            )
    });

    it('should revert when caller is not admin', async function () {
        await expect(
            hhConfigurator
            .connect(alice)
            .initLendingPoolReserve(
                hhNFT.address,
                hhAssetToken.address, 
                hhFToken.address,
                hhDebtToken.address,
                "WETH"))
            .to.be.revertedWith("CA1");
    });
})

describe('Configurator >> LendingPool >> freezeReserve()', function() {

    it('should freeze reserve when caller is emergency admin', async function () {
        // Init Reserve
        await hhConfigurator
            .connect(admin)
            .initLendingPoolReserve(
                hhNFT.address,
                hhAssetToken.address, 
                hhFToken.address,
                hhDebtToken.address,
                "WETH"
            )
        
        await expect(
            hhConfigurator
            .connect(emergencyAdmin)
            .freezeLendingPoolReserve(hhNFT.address, hhAssetToken.address))
            .to.emit(hhLendingPool, "ReserveStatus")
    });

    it('should revert when caller is not emergency admin', async function () {
        // Init Reserve
        await hhConfigurator
            .connect(admin)
            .initLendingPoolReserve(
                hhNFT.address,
                hhAssetToken.address, 
                hhFToken.address,
                hhDebtToken.address,
                "WETH"
            )
        await expect(
            hhConfigurator.connect(admin).freezeLendingPoolReserve(
                hhNFT.address,
                hhAssetToken.address
            ))
            .to.be.revertedWith("EA1");
    });
})

describe('Configurator >> LendingPool >> pauseReserve()', function() {

    it('should pause reserve when caller is emergency admin', async function () {
        // Init Reserve
        await hhConfigurator
            .connect(admin)
            .initLendingPoolReserve(
                hhNFT.address,
                hhAssetToken.address, 
                hhFToken.address,
                hhDebtToken.address,
                "WETH"
            )
        
        await expect(
            hhConfigurator
            .connect(emergencyAdmin)
            .pauseLendingPoolReserve(hhNFT.address, hhAssetToken.address))
            .to.emit(hhLendingPool, "ReserveStatus")
    });

    it('should revert when caller is not emergency admin', async function () {
        // Init Reserve
        await hhConfigurator
            .connect(admin)
            .initLendingPoolReserve(
                hhNFT.address,
                hhAssetToken.address, 
                hhFToken.address,
                hhDebtToken.address,
                "WETH"
            )
        await expect(
            hhConfigurator.connect(admin).pauseLendingPoolReserve(
                hhNFT.address,
                hhAssetToken.address
            ))
            .to.be.revertedWith("EA1");
    });
})

describe('Configurator >> LendingPool >> protectReserve()', function() {

    it('should protect reserve when caller is emergency admin', async function () {
        // Init Reserve
        await hhConfigurator
            .connect(admin)
            .initLendingPoolReserve(
                hhNFT.address,
                hhAssetToken.address, 
                hhFToken.address,
                hhDebtToken.address,
                "WETH"
            )
        
        await expect(
            hhConfigurator
            .connect(emergencyAdmin)
            .protectLendingPoolReserve(hhNFT.address, hhAssetToken.address))
            .to.emit(hhLendingPool, "ReserveStatus")
            // .withArgs(
            //     hhNFT.address,
            //     hhAssetToken.address,
            //     "PROTECTED"
            // );
    });

    it('should revert when caller is not emergency admin', async function () {
        // Init Reserve
        await hhConfigurator
            .connect(admin)
            .initLendingPoolReserve(
                hhNFT.address,
                hhAssetToken.address, 
                hhFToken.address,
                hhDebtToken.address,
                "WETH"
            )
        await expect(
            hhConfigurator.connect(admin).protectLendingPoolReserve(
                hhNFT.address,
                hhAssetToken.address
            ))
            .to.be.revertedWith("EA1");
    });
})

describe('Configurator >> LendingPool >> activateReserve()', function() {

    it('should activate reserve when caller is emergency admin', async function () {
        // Init Reserve
        await hhConfigurator
            .connect(admin)
            .initLendingPoolReserve(
                hhNFT.address,
                hhAssetToken.address, 
                hhFToken.address,
                hhDebtToken.address,
                "WETH"
            )
        
        await expect(
            hhConfigurator
            .connect(emergencyAdmin)
            .activateLendingPoolReserve(hhNFT.address, hhAssetToken.address))
            .to.emit(hhLendingPool, "ReserveStatus")
    });

    it('should revert when caller is not emergency admin', async function () {
        // Init Reserve
        await hhConfigurator
            .connect(admin)
            .initLendingPoolReserve(
                hhNFT.address,
                hhAssetToken.address, 
                hhFToken.address,
                hhDebtToken.address,
                "WETH"
            )
        await expect(
            hhConfigurator.connect(admin).activateLendingPoolReserve(
                hhNFT.address,
                hhAssetToken.address
            ))
            .to.be.revertedWith("EA1");
    });
})

describe('Configurator >> LendingPool >> connectCollateralManager()', function() {
    
    it('should set the Collateral Manager address when caller is admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        );
        
        await expect(
            hhConfigurator
            .connect(admin)
            .connectLendingPoolContract("CM")
            )
            .to.emit(hhLendingPool, "LendingPoolConnected")
    });

    it('should revert when called for a second time', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )

        hhConfigurator
            .connect(admin)
            .connectLendingPoolContract("CM");
        
        await expect(
            hhConfigurator
            .connect(admin)
            .connectLendingPoolContract("CM")
            )
            .to.be.revertedWith("CM1");
    });

    it('should revert when caller is not admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )

        await expect(
            hhConfigurator.connect(alice)
            .connectLendingPoolContract("CM")
            )
            .to.be.revertedWith("CA1");
    });
})

describe('Configurator >> LendingPool >> connectTokenPriceConsumer()', function() {

    it('should set the Token Price Oracle address when caller is admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )

        hhConfigurator
        .connect(admin)
        .connectTokenPriceConsumer(
            hhTokenPriceConsumerAddress
        )

        await expect(
            hhConfigurator
            .connect(admin)
            .connectLendingPoolContract("TOKEN_PRICE_ORACLE")
            )
            .to.emit(hhLendingPool, "LendingPoolConnected")
    });

    it('should revert when caller is not admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
            .connect(admin)
            .connectCollateralManager(
                hhCollateralManagerAddress
            )
    
        await expect(
            hhConfigurator
            .connect(alice)
            .connectLendingPoolContract("PRICE_ORACLE")
            )
            .to.be.revertedWith("CA1");
    });
})

describe('Configurator >> LendingPool >> connectNFTPriceConsumer()', function() {

    it('should set the NFT Price Oracle address when caller is admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        console.log('here1');
        hhConfigurator
        .connect(admin)
        .connectNFTPriceConsumer(
            hhNFTPriceConsumerAddress
        )
        console.log('here2');
        await expect(
            hhConfigurator
            .connect(admin)
            .connectLendingPoolContract("NFT_PRICE_ORACLE")
            )
            .to.emit(hhLendingPool, "LendingPoolConnected")
    });

    it('should revert when caller is not admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
            .connect(admin)
            .connectCollateralManager(
                hhCollateralManagerAddress
            )
        await expect(
            hhConfigurator
            .connect(alice)
            .connectLendingPoolContract("NFT_PRICE_ORACLE")
            )
            .to.be.revertedWith("CA1");
    });
})

/* 
    -------------------------------------------------------------------------------------------
    COLLATERAL MANAGER 
    ===========================================================================================

 */
describe('Configurator >> CollateralManager >> setInterestRate()', function() {

    it('should set the interest rate when caller is admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        const interestRate = ethers.utils.parseUnits('0.22', 18);
        await expect(
            hhConfigurator
            .connect(admin)
            .setCollateralManagerInterestRate(
                hhNFT.address,
                hhAssetToken.address,
                interestRate
            ))
            .to.emit(hhCollateralManager, "SetInterestRate")
            .withArgs(
                hhNFT.address,
                hhAssetToken.address,
                interestRate        
            )
    });

    it('should revert when caller is not admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        const interestRate = ethers.utils.parseUnits('0.22', 18);
        await expect(
            hhConfigurator
            .connect(alice)
            .setCollateralManagerInterestRate(
                hhNFT.address,
                hhAssetToken.address,
                interestRate
            ))
            .to.be.revertedWith("CA1");
    });
})

describe('Configurator >> CollateralManager >> setLiquidationThreshold()', function() {

    it('should set the liquidation threshold when caller is admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        const liquidationThreshold = ethers.utils.parseUnits('1.5', 18);
        await expect(
            hhConfigurator
            .connect(admin)
            .setCollateralManagerLiquidationThreshold(
                hhNFT.address,
                liquidationThreshold
            ))
            .to.emit(hhCollateralManager, "SetLiquidationThreshold")
            .withArgs(
                hhNFT.address,
                liquidationThreshold    
            )
    });

    it('should revert when caller is not admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        const liquidationThreshold = ethers.utils.parseUnits('1.5', 18);
        await expect(
            hhConfigurator
            .connect(alice)
            .setCollateralManagerLiquidationThreshold(
                hhNFT.address,
                liquidationThreshold
            ))
            .to.be.revertedWith("CA1");
    });
})

describe('Configurator >> CollateralManager >> updateWhitelist()', function() {

    it('should set the liquidation threshold when caller is admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )

        const isWhitelisted = true;

        await expect(
            hhConfigurator
            .connect(admin)
            .updateCollateralManagerWhitelist(
                hhNFT.address,
                isWhitelisted
            ))
            .to.emit(hhCollateralManager, "Whitelisted")
            .withArgs(
                hhNFT.address,
                isWhitelisted    
            )
    });

    it('should revert when caller is not admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        const isWhitelisted = true;
        await expect(
            hhConfigurator
            .connect(alice)
            .updateCollateralManagerWhitelist(
                hhNFT.address,
                isWhitelisted
            ))
            .to.be.revertedWith("CA1");
    });
})

describe('Configurator >> CollateralManager >> pause()', function() {

    it('should pause when caller is emergency admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        await expect(
            hhConfigurator.connect(emergencyAdmin).pauseCollateralManager()
        ).to.emit(hhCollateralManager, "Paused")
    });

    it('should revert when caller is not emergency admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        await expect(
            hhConfigurator.connect(admin).pauseCollateralManager()
        ).to.be.revertedWith("EA1");
    });
})

describe('Configurator >> CollateralManager >> unpause()', function() {

    it('should unpause when caller is emergency admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        hhConfigurator.connect(emergencyAdmin).pauseCollateralManager()
        await expect(
            hhConfigurator.connect(emergencyAdmin).unpauseCollateralManager()
        ).to.emit(hhCollateralManager, "Unpaused")
    });

    it('should revert when caller is not emergency admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        await expect(
            hhConfigurator.connect(admin).unpauseCollateralManager()
        ).to.be.revertedWith("EA1");
    });
})

describe('Configurator >> FToken >> pause()', function() {

    it('should pause when caller is emergency admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        await expect(
            hhConfigurator.connect(emergencyAdmin).pauseFToken(
                hhFToken.address
            )
        ).to.emit(hhFToken, "Paused")
    });

    it('should revert when caller is not emergency admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        await expect(
            hhConfigurator.connect(admin).pauseFToken(
                hhFToken.address
            )
        ).to.be.revertedWith("EA1");
    });
})

describe('Configurator >> FToken >> unpause()', function() {

    it('should unpause when caller is emergency admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        hhConfigurator.connect(emergencyAdmin).pauseFToken(
            hhFToken.address
        )
        await expect(
            hhConfigurator.connect(emergencyAdmin).unpauseFToken(
                hhFToken.address
            )
        ).to.emit(hhFToken, "Unpaused")
    });

    it('should revert when caller is not emergency admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        await expect(
            hhConfigurator.connect(admin).unpauseFToken(
                hhFToken.address
            )
        ).to.be.revertedWith("EA1");
    });
})

describe('Configurator >> DebtToken >> pause()', function() {

    it('should pause when caller is emergency admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        await expect(
            hhConfigurator.connect(emergencyAdmin).pauseDebtToken(
                hhDebtToken.address
            )
        ).to.emit(hhDebtToken, "Paused")
    });

    it('should revert when caller is not emergency admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        await expect(
            hhConfigurator.connect(admin).pauseDebtToken(
                hhDebtToken.address
            )
        ).to.be.revertedWith("EA1");
    });
})

describe('Configurator >> DebtToken >> unpause()', function() {

    it('should unpause when caller is emergency admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        hhConfigurator.connect(emergencyAdmin).pauseDebtToken(
            hhDebtToken.address
        )
        await expect(
            hhConfigurator.connect(emergencyAdmin).unpauseDebtToken(
                hhDebtToken.address
            )
        ).to.emit(hhDebtToken, "Unpaused")
    });

    it('should revert when caller is not emergency admin', async function () {
        // Connect CollateralManager in Configurator
        hhConfigurator
        .connect(admin)
        .connectCollateralManager(
            hhCollateralManagerAddress
        )
        await expect(
            hhConfigurator.connect(admin).unpauseDebtToken(
                hhDebtToken.address
            )
        ).to.be.revertedWith("EA1"); //
    });
})