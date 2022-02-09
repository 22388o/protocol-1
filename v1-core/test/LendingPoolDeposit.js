const { expect } = require('chai');
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
let NToken;
let hhNToken;
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
    await hhConfigurator.connectLendingPoolLendingPoolBorrow();

    // Get, deploy and connect LendingPoolDeposit to LendingPool
    LendingPoolDeposit = await ethers.getContractFactory('LendingPoolDeposit');
    hhLendingPoolDeposit = await LendingPoolDeposit.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
    );
    await hhLendingPoolDeposit.deployed();
    hhLendingPoolDepositAddress = await hhLendingPoolDeposit.resolvedAddress;
    await hhConfigurator.connectLendingPoolDeposit(hhLendingPoolDepositAddress);
    await hhConfigurator.connectLendingPoolLendingPoolDeposit();

    // Get, deploy and connect LendingPoolLiquidate to LendingPool
    LendingPoolLiquidate = await ethers.getContractFactory('LendingPoolLiquidate');
    hhLendingPoolLiquidate = await LendingPoolLiquidate.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
    );
    await hhLendingPoolLiquidate.deployed();
    hhLendingPoolLiquidateAddress = await hhLendingPoolLiquidate.resolvedAddress;
    await hhConfigurator.connectLendingPoolLiquidate(hhLendingPoolLiquidateAddress);
    await hhConfigurator.connectLendingPoolLendingPoolLiquidate();

    // Get, deploy and connect LendingPoolRepay to LendingPool
    LendingPoolRepay = await ethers.getContractFactory('LendingPoolRepay');
    hhLendingPoolRepay = await LendingPoolRepay.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
    );
    await hhLendingPoolRepay.deployed();
    hhLendingPoolRepayAddress = await hhLendingPoolRepay.resolvedAddress;
    await hhConfigurator.connectLendingPoolRepay(hhLendingPoolRepayAddress);
    await hhConfigurator.connectLendingPoolLendingPoolRepay();

    // Get, deploy and connect LendingPoolWithdraw to LendingPool
    LendingPoolWithdraw = await ethers.getContractFactory('LendingPoolWithdraw');
    hhLendingPoolWithdraw = await LendingPoolWithdraw.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
    );
    await hhLendingPoolWithdraw.deployed();
    hhLendingPoolWithdrawAddress = await hhLendingPoolWithdraw.resolvedAddress;
    await hhConfigurator.connectLendingPoolWithdraw(hhLendingPoolWithdrawAddress);
    await hhConfigurator.connectLendingPoolLendingPoolWithdraw();


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
    .connectLendingPoolCollateralManager();

    // Get and deploy Asset Token
    AssetToken = await ethers.getContractFactory('AssetToken');
    hhAssetToken = await AssetToken.deploy('Dai Token', 'DAI', hhAssetTokenSupply.toString());
    await hhAssetToken.deployed();
    
    // Get and deploy nToken
    NToken = await ethers.getContractFactory('NToken');
    hhNToken = await NToken.deploy(
        hhConfiguratorAddress,
        hhLendingPoolAddress,
        'Dai nToken', 
        'nDAI');
    await hhNToken.deployed();

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
    .setCollateralManagerInterestRate(hhNFT.address, ethers.utils.parseUnits(interestRate.toString(), 25)); // RAD 1e27 / 100 to turn into percent


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
    // console.log('LendingPzoolAddress deployed:', hhLendingPoolAddress);
    // console.log('alice:', alice.address);
    // console.log('bob:', bob.address);
});

async function initReserve() {
    return hhConfigurator
    .connect(admin)
    .initLendingPoolReserve(
        hhAssetToken.address, 
        hhNToken.address,
        hhDebtToken.address
    )
}

async function deposit(signer, assetToken, tokenAmount) {
    // Approve transferFrom lendingPool 
    await assetToken.connect(signer).approve(hhLendingPoolAddress, tokenAmount);
    // Deposit in hhNToken contract reserve
    return hhLendingPool.connect(signer).deposit(assetToken.address, tokenAmount)
}

async function withdraw(signer, assetToken, nToken, _tokenAmount) {
    // Approve nToken burnFrom lendingPool 
    await nToken.connect(signer).approve(hhLendingPoolAddress, _tokenAmount);
    // Withdraw assetTokens by depositing/buring nTokens
    return hhLendingPool.connect(signer).withdraw(assetToken.address, _tokenAmount);
}

async function borrow(signer, nftToken, tokenId, assetToken, tokenAmount, numWeeks) {
    // Approve NFT transfer
    await nftToken.connect(signer).approve(hhCollateralManagerAddress, tokenId);
    return hhLendingPool.connect(signer).borrow(
        assetToken.address,
        tokenAmount,
        nftToken.address,
        tokenId, 
        numWeeks);
}

async function repay(signer, assetToken, nToken, repaymentAmount, borrowId) {
    // Approve transfer of repaymentAmount asset tokens to nToken address (asset reserve)
    await assetToken.connect(signer).approve(nToken.address, repaymentAmount);
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
    
describe('LendingPool >> Deposit', function() {

    it('should deposit tokens to NToken reserve', async function () {
        const tokenAmount = ethers.utils.parseUnits('1', 18);//1*10**numDecimals;

        const borrowAmount = 1;
        const numWeeks = 1;
        const borrowAmountWad = ethers.utils.parseUnits(borrowAmount.toString(), 18); //1*10**numDecimals;
      

        // Initialize reserve
        await initReserve();

        // Deposit Asset tokens
        async function _deposit(signer, assetToken, tokenAmount) {
            return deposit(signer, assetToken, tokenAmount);
        }

        // Expect: Deposit Emit response
        await expect(
            _deposit(alice, hhAssetToken, tokenAmount))
            .to.emit(hhLendingPool, 'Deposit')
            .withArgs(
                hhAssetToken.address,
                tokenAmount,
                alice.address,
                tokenAmount);

        // Expect: assetTokens transferred from alice to hhNToken contract
        await expect(
            (await hhAssetToken.balanceOf(alice.address)))
            .to.equal((hhAssetTokenInitialBalance.sub(tokenAmount)));
        await expect(
            (await hhAssetToken.balanceOf(hhNToken.address)))
            .to.equal(tokenAmount);

        // Expect: nTokens minted to alice 
        await expect(
            (await hhNToken.balanceOf(hhNToken.address)))
            .to.equal(0);
        await expect(
            (await hhNToken.balanceOf(alice.address)))
            .to.equal(tokenAmount);

        
        // Borrow Asset tokens
        async function _borrow(signer, nftToken, bob_tokenId, assetToken, tokenAmount, numWeeks) {
            return borrow(signer, nftToken, bob_tokenId, assetToken, tokenAmount, numWeeks);
        }

        _borrow(bob, hhNFT, bob_tokenId, hhAssetToken, borrowAmountWad, numWeeks)

        // Expect: Deposit Emit response with different tokenAmount
        await expect(
            _deposit(alice, hhAssetToken, tokenAmount))
            .to.emit(hhLendingPool, 'Deposit')
            .withArgs(
                hhAssetToken.address,
                tokenAmount,
                alice.address,
                tokenAmount);
    });

    // it('should update liquidity index', async function () {
    //     const tokenAmount = ethers.utils.parseUnits('1', 18);//1*10**numDecimals;
        
    //     const liquidityRate = 0;
    //     const timeDelta = 2;
    //     const borrowRate = 0;
    //     const utilizationRate = 0;
    //     const liquidityIndex = ethers.utils.parseUnits('1',27);
    //     const updatedLiquidityIndex = liquidityIndex.mul((liquidityRate * timeDelta)/(365 * 24 * 60 * 60) + 1);

    //     // Initialize reserve
    //     await initReserve();

    //     // Deposit >> Expect liquidityIndex
    //     await expect(
    //         deposit(alice, hhAssetToken, tokenAmount))
    //         .to.emit(hhLendingPool, 'UpdateReserve')
    //         .withArgs(
    //             hhAssetToken.address,
    //             borrowRate,
    //             utilizationRate,
    //             liquidityIndex);

    //     // Deposit (w/ system timeDelta == 2) >> Expect updatedLiquidityIndex
    //     await expect(
    //         deposit(alice, hhAssetToken, tokenAmount))
    //         .to.emit(hhLendingPool, 'UpdateReserve')
    //         .withArgs(
    //             hhAssetToken.address,
    //             borrowRate,
    //             utilizationRate,
    //             updatedLiquidityIndex);
    // });

    // it('should update scaled user balance', async function() {
        
    // });

    // it('should update user nToken balance', async function() {
    // });
});