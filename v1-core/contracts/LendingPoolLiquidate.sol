// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import { DataTypes } from "./libraries/DataTypes.sol";
import { LendingPoolStorage } from './LendingPoolStorage.sol';
import { LendingPoolLogic } from './LendingPoolLogic.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { ICollateralManager } from "./interfaces/ICollateralManager.sol";
import { IFToken } from "./interfaces/IFToken.sol";
import { IDebtToken } from "./interfaces/IDebtToken.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import { ILendingPoolLiquidate } from "./interfaces/ILendingPoolLiquidate.sol";
import { SafeMath } from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import "./WadRayMath.sol";
import "hardhat/console.sol";

contract LendingPoolLiquidate is Context, LendingPoolStorage, LendingPoolLogic, ILendingPoolLiquidate, Pausable, AccessControl {
    using SafeMath for uint256; 
    using WadRayMath for uint256;

    bytes32 public constant CONFIGURATOR_ROLE = keccak256("CONFIGURATOR_ROLE");
    bytes32 public constant LENDING_POOL_ROLE = keccak256("LENDING_POOL_ROLE");
    
    struct LiquidateVars {
        bool success;
        uint256 repaymentAmount;
        uint256 remainderAmount;
        uint256 reimbursementAmount;
    }

    constructor(address configurator, address lendingPool) {
        _setupRole(CONFIGURATOR_ROLE, configurator);
        _setupRole(LENDING_POOL_ROLE, lendingPool);
    }

    modifier onlyConfigurator() {
        require(hasRole(CONFIGURATOR_ROLE, _msgSender()), "Caller is not the Configurator");
        _;
    }

    modifier onlyLendingPool() {
        require(hasRole(LENDING_POOL_ROLE, _msgSender()), "Caller is not the Lending Pool");
        _;
    }

    /// @notice Pauses the contract deposit and withdraw functions.
    /// @dev Functions paused via modifiers using Pausable contract.
    function pause() external onlyConfigurator {
        _pause();
    }

    /// @notice Unpauses the contract deposit and withdraw functions.
    /// @dev Functions unpaused via modifiers using Pausable contract.
    function unpause() external onlyConfigurator {
        _unpause();
    }

    function getAuctionDuration() public view returns (uint40) {
        return _auctionDuration;
    }    

    /// @notice Private function to liquidate a borrow position.
    /// @param collateral The NFT collateral contract address.
    /// @param asset The ERC20 address of the asset.
    /// @param borrowId The unique identifier of the borrow.
    /// @dev To be called after a liquidity auction has ended to distribute NFT + assets to the appropriate parties.
    /// @dev Transfers assets back to the reserve before burning debtTokens and retreiving collateral for the liquidator. 
    function liquidate(
        address collateral,
        address asset,
        uint256 borrowId
    ) 
        external
        // onlyLendingPool
        returns (bool)
    {
        uint40 auctionDuration = getAuctionDuration();
        DataTypes.Borrow memory borrowItem = ICollateralManager(
            _collateralManagerAddress
        ).getBorrow(borrowId);
        DataTypes.Reserve storage reserve = _reserves[keccak256(abi.encode(borrowItem.collateral.erc721Token, borrowItem.erc20Token))]; 
        LiquidateVars memory vars;

        require(borrowItem.status == DataTypes.BorrowStatus.ActiveAuction, "AUCTION_NOT_TRIGGERED");
        require(uint40(block.timestamp) - borrowItem.auction.timestamp > auctionDuration, "AUCTION_STILL_ACTIVE"); 
        // require(borrowItem.erc20Token == asset, "INCORRECT_ASSET");
        // require(borrowItem.collateral.erc721Token == collateral, "INCORRECT_COLLATERAL");

        vars.success = IFToken(reserve.fTokenAddress).reserveTransfer(borrowItem.auction.caller, borrowItem.erc20Token, borrowItem.auction.liquidationFee);
        require(vars.success, "UNSUCCESSFUL_TRANSFER_TO_AUCTION_CALLER");

        vars.repaymentAmount = borrowItem.borrowAmount
            .add(
                (borrowItem.borrowAmount)
                .rayMul(borrowItem.interestRate)
                .mul(block.timestamp.sub(borrowItem.timestamp))
                .div(365 days)
            );
        vars.remainderAmount = borrowItem.auction.bid.sub(vars.repaymentAmount);
        vars.reimbursementAmount = vars.remainderAmount.sub(borrowItem.auction.liquidationFee);

        uint256 liquidationFeeToCaller = borrowItem.auction.liquidationFee.mul(90).div(100); // TODO: make this updatable. E.g. this split is 4.5% to Caller and 0.5% to Protocol to cover dust
        uint256 liquidationFeeToProtocol = borrowItem.auction.liquidationFee - liquidationFeeToCaller;

        vars.success = IFToken(reserve.fTokenAddress).reserveTransfer(borrowItem.auction.caller, borrowItem.erc20Token, liquidationFeeToCaller);
        require(vars.success, "UNSUCCESSFUL_TRANSFER_TO_AUCTION_CALLER");

        vars.success = IFToken(reserve.fTokenAddress).reserveTransfer(_treasuryAddress, borrowItem.erc20Token, liquidationFeeToProtocol);
        require(vars.success, "UNSUCCESSFUL_TRANSFER_TO_AUCTION_CALLER");

        vars.success = IFToken(reserve.fTokenAddress).reserveTransfer(borrowItem.borrower, borrowItem.erc20Token, vars.reimbursementAmount);
        require(vars.success, "UNSUCCESSFUL_TRANSFER_TO_BORROWER");

        vars.success = IDebtToken(reserve.debtTokenAddress).burnFrom(borrowItem.borrower, vars.repaymentAmount);
        require(vars.success, "UNSUCCESSFUL_BURN");

        vars.success = ICollateralManager(_collateralManagerAddress).retrieve(
            borrowId, 
            borrowItem.erc20Token, 
            vars.repaymentAmount,
            borrowItem.auction.bidder
        );
        require(vars.success, "UNSUCCESSFUL_RETRIEVE");
   
        // Update reserve borrow numbers - for use in APR calculation
        if (reserve.borrowAmount.sub(borrowItem.borrowAmount) > 0) {
            reserve.borrowRate = WadRayMath.rayDiv(
                WadRayMath.rayMul(
                    WadRayMath.wadToRay(reserve.borrowAmount), reserve.borrowRate
                ).sub(
                    WadRayMath.rayMul(
                        WadRayMath.wadToRay(borrowItem.borrowAmount), borrowItem.interestRate 
                    )    
                ), (WadRayMath.wadToRay(reserve.borrowAmount).sub(WadRayMath.wadToRay(borrowItem.borrowAmount)))
            );
        } else {
            reserve.borrowRate  = 0;
        }

        reserve.borrowAmount = reserve.borrowAmount.sub(borrowItem.borrowAmount);

        return vars.success;
    }

}