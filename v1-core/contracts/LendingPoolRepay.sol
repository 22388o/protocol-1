// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import { DataTypes } from "./libraries/DataTypes.sol";
import { LendingPoolStorage } from './LendingPoolStorage.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { ICollateralManager } from "./interfaces/ICollateralManager.sol";
import { IFToken } from "./interfaces/IFToken.sol";
import { IDebtToken } from "./interfaces/IDebtToken.sol";
import { INFTPriceConsumer } from "./interfaces/INFTPriceConsumer.sol";
import { ITokenPriceConsumer } from "./interfaces/ITokenPriceConsumer.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import { ILendingPoolRepay } from "./interfaces/ILendingPoolRepay.sol";
import { SafeMath } from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import { InterestLogic } from "./libraries/InterestLogic.sol";
import "./WadRayMath.sol";
import "hardhat/console.sol";

contract LendingPoolRepay is Context, LendingPoolStorage, ILendingPoolRepay, Pausable, AccessControl {
    using SafeMath for uint256;
    using WadRayMath for uint256;

    bytes32 public constant CONFIGURATOR_ROLE = keccak256("CONFIGURATOR_ROLE");
    bytes32 public constant LENDING_POOL_ROLE = keccak256("LENDING_POOL_ROLE");
    
    struct RepayVars {
        bool success;
        bool partialRepayment;
        uint256 borrowAmount;
        uint256 repaymentAmount;
        uint256 accruedBorrowAmount;
        uint256 interestRate;
        uint256 floorPrice;
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

    /// @notice Private function to repay a borrow position.
    /// @param collateral The lending pool collateral contract address.
    /// @param asset The ERC20 token to be borrowed.
    /// @param repaymentAmount The amount of ERC20 tokens to be repaid.
    /// @param borrowId The unique identifier of the borrow.
    /// @dev Transfers assets back to the reserve before burning debtTokens and returning collateral. 
    function repay(
        address collateral,
        address asset,
        uint256 repaymentAmount,
        uint256 borrowId
    ) 
        external
        // onlyLendingPool
        returns (bool, uint256) 
    {
        RepayVars memory vars;
        vars.borrowItem = ICollateralManager(_collateralManagerAddress).getBorrow(borrowId);
        DataTypes.Reserve storage reserve = _reserves[keccak256(abi.encode(collateral, asset))]; 

        vars.accruedBorrowAmount = vars.borrowItem.borrowAmount.rayMul(
            InterestLogic.calculateLinearInterest(vars.borrowItem.interestRate, vars.borrowItem.timestamp)
        );
        vars.partialRepayment = repaymentAmount < vars.accruedBorrowAmount;
        vars.repaymentAmount = vars.partialRepayment ? repaymentAmount : vars.accruedBorrowAmount;

        vars.success = IFToken(reserve.fTokenAddress).reserveTransferFrom(_msgSender(), asset, vars.repaymentAmount);  
        require(vars.success, "UNSUCCESSFUL_TRANSFER");

        if (vars.partialRepayment) {
            vars.floorPrice = INFTPriceConsumer(_nftPriceConsumerAddress).getFloorPrice(vars.borrowItem.collateral.erc721Token);
            if (keccak256(abi.encodePacked(_assetNames[asset])) != keccak256(abi.encodePacked("WETH"))) {
                vars.floorPrice = vars.floorPrice.mul(ITokenPriceConsumer(_tokenPriceConsumerAddress).getEthPrice(asset));
            }
            (vars.success, vars.borrowAmount, vars.interestRate) = ICollateralManager(_collateralManagerAddress).updateBorrow(
                borrowId,
                asset,
                vars.repaymentAmount, 
                vars.floorPrice,
                DataTypes.BorrowStatus.Active,
                true, // isRepayment
                _msgSender()
            );
            require(vars.success, "UNSUCCESSFUL_PARTIAL_REPAY");           
        } else {
            (vars.success, vars.borrowAmount, vars.interestRate) = ICollateralManager(_collateralManagerAddress).withdraw(
                borrowId, 
                asset, 
                vars.repaymentAmount //repaymentAmount
            );
            require(vars.success, "UNSUCCESSFUL_WITHDRAW");   
        }

        vars.success = IDebtToken(reserve.debtTokenAddress).burnFrom(_msgSender(), vars.repaymentAmount); 
        require(vars.success, "UNSUCCESSFUL_BURN");

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

        return (vars.success, vars.repaymentAmount);
    }
}