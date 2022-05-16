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
import { ILendingPoolRedeem } from "./interfaces/ILendingPoolRedeem.sol";
import { INFTPriceConsumer } from "./interfaces/INFTPriceConsumer.sol";
import { ITokenPriceConsumer } from "./interfaces/ITokenPriceConsumer.sol";
import { InterestLogic } from "./libraries/InterestLogic.sol";
import { SafeMath } from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import "./WadRayMath.sol";
import "hardhat/console.sol";

contract LendingPoolRedeem is Context, LendingPoolStorage, LendingPoolLogic, ILendingPoolRedeem, Pausable, AccessControl {
    using SafeMath for uint256; 
    using WadRayMath for uint256;

    bytes32 public constant CONFIGURATOR_ROLE = keccak256("CONFIGURATOR_ROLE");
    bytes32 public constant LENDING_POOL_ROLE = keccak256("LENDING_POOL_ROLE");
    
    struct RedeemVars {
        bool success;
        uint256 borrowAmount;
        uint256 borrowBalanceAmount;
        uint256 interestRate;
        uint256 floorPrice;
        uint256 repaymentAmount;
        uint256 overpaymentAmount;
        uint256 liquidationThreshold;
        DataTypes.Borrow borrowItem;
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

    /// @notice Private function to redeem a defaulted borrow position.
    /// @param asset The ERC20 token to be borrowed.
    /// @param redeemAmount The amount of ERC20 tokens to redeem borrow position.
    /// @param borrowId The unique identifier of the borrow.
    /// @dev Top bid amount held in protocol to cover defaulted borrow position. Previous bid returned. First bid triggers auction.
    function redeem(
        address collateral,
        address asset,
        uint256 redeemAmount,
        uint256 borrowId
    ) 
        external
        // onlyLendingPool
        returns (bool)
    { 
        RedeemVars memory vars;
        vars.borrowItem = ICollateralManager(
            _collateralManagerAddress
        ).getBorrow(borrowId);
        DataTypes.Reserve storage reserve = _reserves[keccak256(abi.encode(vars.borrowItem.collateral.erc721Token, asset))];  
        

        require(vars.borrowItem.borrower == _msgSender(), "NOT_BORROWER");
        require(vars.borrowItem.erc20Token == asset, "INCORRECT_ASSET");
        require(vars.borrowItem.collateral.erc721Token == collateral, "INCORRECT_COLLATERAL");
        require(vars.borrowItem.status == DataTypes.BorrowStatus.ActiveAuction, "INACTIVE_AUCTION");

        vars.borrowBalanceAmount = vars.borrowItem.borrowAmount.rayMul(
            InterestLogic.calculateLinearInterest(vars.borrowItem.interestRate, vars.borrowItem.timestamp)
        );
        require(redeemAmount > vars.borrowItem.auction.liquidationFee, "INSUFFICIENT_AMOUNT"); 
        vars.repaymentAmount = redeemAmount - vars.borrowItem.auction.liquidationFee;
        require(vars.repaymentAmount <= vars.borrowBalanceAmount , "OVERPAYMENT"); 

        vars.floorPrice = INFTPriceConsumer(_nftPriceConsumerAddress).getFloorPrice(vars.borrowItem.collateral.erc721Token);
        if (keccak256(abi.encodePacked(_assetNames[asset])) != keccak256(abi.encodePacked("WETH"))) {
            vars.floorPrice = vars.floorPrice.mul(ITokenPriceConsumer(_tokenPriceConsumerAddress).getEthPrice(asset));
        }
        vars.liquidationThreshold = vars.borrowItem.liquidationPrice.mul(100).div(vars.borrowItem.borrowAmount);
        require(vars.borrowBalanceAmount - vars.repaymentAmount < vars.floorPrice.mul(100).div(vars.liquidationThreshold), "INSUFFICIENT_AMOUNT");
        
        vars.success = IERC20(asset).transferFrom(_msgSender(), reserve.fTokenAddress, vars.repaymentAmount);
        require(vars.success, "UNSUCCESSFUL_TRANSFER_TO_RESERVE");
        
        vars.success = IDebtToken(reserve.debtTokenAddress).burnFrom(_msgSender(), vars.repaymentAmount);
        require(vars.success, "UNSUCCESSFUL_BURN");
       
        vars.success = IERC20(asset).transferFrom(_msgSender(), vars.borrowItem.auction.caller, vars.borrowItem.auction.liquidationFee);
        require(vars.success, "UNSUCCESSFUL_TRANSFER_TO_AUCTION_CALLER");

        if (redeemAmount < vars.borrowBalanceAmount + vars.borrowItem.auction.liquidationFee) {
            (vars.success, vars.borrowAmount, vars.interestRate) = ICollateralManager(_collateralManagerAddress).updateBorrow(
                borrowId, 
                asset,
                vars.repaymentAmount,
                vars.floorPrice,
                DataTypes.BorrowStatus.Active,
                true, // isRepayment
                _msgSender()
            );
            require(vars.success, "UNSUCCESSFUL_PARTIAL_REDEEM");
        } else {
            (vars.success,,) = ICollateralManager(_collateralManagerAddress).withdraw(
                borrowId, 
                asset, 
                vars.borrowBalanceAmount
            );
            require(vars.success, "UNSUCCESSFUL_WITHDRAW");
            (vars.success, vars.borrowAmount, vars.interestRate) = ICollateralManager(_collateralManagerAddress).updateBorrow(
                borrowId, 
                asset,
                vars.repaymentAmount,
                vars.floorPrice,
                DataTypes.BorrowStatus.Repaid,
                true, // isRepayment
                _msgSender()
            );
            require(vars.success, "UNSUCCESSFUL_FULL_REDEEM");
        } 

        // Update reserve borrow numbers - for use in APR calculation
        if (reserve.borrowAmount.sub(vars.borrowAmount) > 0) {
            reserve.borrowRate = WadRayMath.rayDiv(
                WadRayMath.rayMul(
                    WadRayMath.wadToRay(reserve.borrowAmount), reserve.borrowRate
                ).sub(
                    WadRayMath.rayMul(
                        WadRayMath.wadToRay(vars.borrowAmount), vars.interestRate 
                    )    
                ), (WadRayMath.wadToRay(reserve.borrowAmount).sub(WadRayMath.wadToRay(vars.borrowAmount)))
            );
        } else {
            reserve.borrowRate  = 0;
        }

        reserve.borrowAmount = reserve.borrowAmount.sub(vars.borrowAmount);

        return vars.success;
    }

}