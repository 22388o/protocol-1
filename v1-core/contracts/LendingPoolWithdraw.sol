// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import { DataTypes } from "./libraries/DataTypes.sol";
import { LendingPoolStorage } from './LendingPoolStorage.sol';
import { LendingPoolLogic } from './LendingPoolLogic.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import { IFToken } from "./interfaces/IFToken.sol";

import "@openzeppelin/contracts/utils/Context.sol";
import { ILendingPoolWithdraw } from "./interfaces/ILendingPoolWithdraw.sol";

contract LendingPoolWithdraw is Context, LendingPoolStorage, LendingPoolLogic, ILendingPoolWithdraw, Pausable, AccessControl {

    bytes32 public constant CONFIGURATOR_ROLE = keccak256("CONFIGURATOR_ROLE");
    bytes32 public constant LENDING_POOL_ROLE = keccak256("LENDING_POOL_ROLE");
    
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

    /// @notice Private function to withdraw assets from the lending pool.
    /// @param collateral The lending pool collateral contract address.
    /// @param asset The ERC20 address of the asset.
    /// @param amount The amount of ERC20 tokens.
    /// @dev Withdraws assets from the LP by exchanging fTokens at a 1:1 ratio. 
    function withdraw(
        address collateral,
        address asset, 
        uint256 amount
    ) 
        external
        returns (bool) 
    {
        bool success;
        DataTypes.Reserve memory reserve = _reserves[keccak256(abi.encode(collateral, asset))];        
        address fToken = reserve.fTokenAddress;

        uint256 fTokenBalance = IFToken(fToken).balanceOf(_msgSender());
        require(fTokenBalance >= amount, "INSUFFICIENT_BALANCE");

        uint256 liquidityIndex = getLiquidityIndex(collateral, asset);

        success = IFToken(fToken).burnFrom(_msgSender(), amount, liquidityIndex);
        require(success, "UNSUCCESSFUL_BURN");

        success = IFToken(fToken).reserveTransfer(_msgSender(), asset, amount);
        require(success, "UNSUCCESSFUL_TRANSFER");
        
        return success;
    }
}