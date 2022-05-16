// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import { ILendingPool } from './interfaces/ILendingPool.sol';
import { IFToken } from './interfaces/IFToken.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts/utils/Context.sol";
import { SafeMath } from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import "./WadRayMath.sol";

import "hardhat/console.sol";

/// @title FToken Contract for the NFTlend protocol.
/// @author Niftrr
/// @notice Allows for the tracking of asset positions for purpose the yield accrual.
/// @dev FTokens follow the ERC20 standard in that they can be transferred and traded elsewhere.
contract FToken is Context, ERC20Pausable, IFToken, AccessControl, ReentrancyGuard {
    using SafeMath for uint256;
    using WadRayMath for uint256;
    
    bytes32 public constant CONFIGURATOR_ROLE = keccak256("CONFIGURATOR_ROLE");
    bytes32 public constant LENDING_POOL_ROLE = keccak256("LENDING_POOL_ROLE");

    // uint256 currentAPY; 
    ILendingPool internal _pool;
    address internal _underlyingCollateral;
    address internal _underlyingAsset;
    address internal _treasury;

    /// @notice Emitted when fTokens are minted.
    /// @param to The recipient account.
    /// @param amount The present amount of real-world assets that the minted fTokens represent.
    /// @param amountScaled The amount of fTokens minted.
    event Mint(address to, uint256 amount, uint256 amountScaled);

    /// @notice Emitted when fTokens are minted.
    /// @param from The sender account.
    /// @param amount The present amount of real-world assets that the burned fTokens represent.
    /// @param amountScaled The amount of fTokens burned.
    event Burn(address from, uint256 amount, uint256 amountScaled);

    /// @notice Emitted when fTokens are minted.
    /// @param from The sender account.
    /// @param to The recipient account.
    /// @param amount The present amount of real-world assets that the fTokens represent.
    /// @param liquidityIndex The liquidityIndex.
    event BalanceTransfer(address from, address to, uint256 amount, uint256 liquidityIndex);

    /// @notice Emitted when a reserve transfer is sent.
    /// @param from The sender account.
    /// @param to The recipient account.
    /// @param amount The amount of Asset tokens.
    event ReserveTransfer(address from, address to, uint256 amount);

    constructor(
        address configurator, 
        address lendingPool,
        address treasury,
        address underlyingCollateral,
        address underlyingAsset,
        string memory name, 
        string memory symbol
    ) 
        ERC20(name, symbol) 
    {
        _setupRole(CONFIGURATOR_ROLE, configurator);
        _setupRole(LENDING_POOL_ROLE, lendingPool);
        _pool = ILendingPool(lendingPool);
        _treasury = treasury;
        _underlyingCollateral = underlyingCollateral;
        _underlyingAsset = underlyingAsset;
    }

    modifier onlyConfigurator() {
        require(hasRole(CONFIGURATOR_ROLE, _msgSender()), "Caller is not the Configurator");
        _;
    }

    modifier onlyLendingPool() {
        require(hasRole(LENDING_POOL_ROLE, _msgSender()), "Caller is not the Lending Pool");
        _;
    }

    /// @notice Mints an amount of FTokens to a given account.
    /// @param to The account.
    /// @param amount The amount of FTokens.
    /// @dev Calls the underlying ERC20 `_mint` function.
    /// @return Boolean for execution success.
    function mint(
        address to, 
        uint256 amount,
        uint256 liquidityIndex
    ) 
        external 
        virtual 
        override 
        nonReentrant
        // onlyLendingPool 
        whenNotPaused 
        returns (bool)
    {
        uint256 amountScaled = amount.rayDiv(liquidityIndex);
        require(amountScaled != 0, "MINT_AMOUNT_ZERO");
        _mint(to, amountScaled);
        
        emit Mint(to, amount, amountScaled);
        return true;
    }

    /// @notice Burns an amount of FTokens from the _msgSender() account.
    /// @param amount The amount of FTokens.
    /// @dev Calls the underlying ERC20 `_burn` function.
    /// @return Boolean for execution success.
    function burn(
        uint256 amount,
        uint256 liquidityIndex
    ) 
        public 
        virtual 
        override
        nonReentrant 
        // onlyLendingPool 
        whenNotPaused  
        returns (bool)
    {
        uint256 amountScaled = amount.rayDiv(liquidityIndex);
        require(amountScaled != 0, "BURN_AMOUNT_ZERO");

        _burn(_msgSender(), amountScaled);

        emit Burn(_msgSender(), amount, amountScaled);
        return true;
    }

    /// @notice Burns an amount of FTokens from a given account.
    /// @param account The account.
    /// @param amount The amount of debt tokens.
    /// @dev Calls the underlying ERC20 `_burn` function.
    /// @return Boolean for execution success.
    function burnFrom(
        address account, 
        uint256 amount,
        uint256 liquidityIndex
    ) 
        external 
        virtual 
        override 
        nonReentrant
        // onlyLendingPool 
        whenNotPaused 
        returns (bool)
    {
        uint256 amountScaled = amount.rayDiv(liquidityIndex);
        require(amountScaled != 0, "BURN_FROM_AMOUNT_ZERO");
        uint256 currentAllowance = allowance(account, _msgSender());
        require(currentAllowance >= amountScaled, "ERC20: burn amount exceeds allowance");
        unchecked {
            _approve(account, _msgSender(), currentAllowance - amountScaled);
        }
        _burn(account, amountScaled);
        emit Burn(account, amount, amountScaled);
        return true;
    }

    /// @notice Transfer of Asset tokens from the reserve.
    /// @param to The recipient account.
    /// @param asset The Asset token.
    /// @param amount The amount of Asset tokens.
    /// @dev Asset tokens reclaimed from the FToken reserve.
    /// @return Boolean for execution success.
    function reserveTransfer(
        address to, 
        address asset, 
        uint256 amount
    ) 
        external 
        virtual 
        override 
        nonReentrant
        onlyLendingPool 
        whenNotPaused
        returns (bool)
    {
        bool success;
        require(IERC20(asset).balanceOf(address(this)) >= amount, "Insufficient supply of asset token in reserve.");
        success = IERC20(asset).approve(to, amount);
        require(success, "UNSUCCESSFUL_APPROVE");
        success = IERC20(asset).transfer(to, amount);
        require(success, "UNSUCCESSFUL_TRANSFER");
        emit ReserveTransfer(address(this), to, amount);
        return success;
    }

    /// @notice Transfers Asset tokens to the reserve.
    /// @param from The sender account.
    /// @param asset The Asset token.
    /// @param amount The amount of Asset tokens.
    /// @dev Asset tokens deposited to the FToken reserve.
    /// @return Boolean for execution success.
    function reserveTransferFrom(
        address from, 
        address asset, 
        uint256 amount
    ) 
        external 
        virtual 
        override 
        nonReentrant
        onlyLendingPool 
        whenNotPaused
        returns (bool)
    {
        bool success;
        require(IERC20(asset).balanceOf(from) >= amount, "Insufficient user asset token balance.");
        success = IERC20(asset).transferFrom(from, address(this), amount);
        require(success, "UNSUCCESSFUL_TRANSFER");
        emit ReserveTransfer(from, address(this), amount);
        return success;
    }

    function balanceOf(
        address account
    )
        public
        view
        virtual
        override(ERC20, IERC20)
        returns (uint256)
    {
        // address asset = ILendingPool(_lendingPool).getUnderlyingAsset(address(this));
        // uint256 liquidityIndex = ILendingPool(_lendingPool).getLiquidityIndex(asset);
        // uint256 liquidityIndex = WadRayMath.ray();  
        // return super.balanceOf(account).rayMul(liquidityIndex);
        // address asset = ILendingPool(_lendingPool).getUnderlyingAsset(address(this));
        return super.balanceOf(account).rayMul(_pool.getReserveNormalizedIncome(_underlyingCollateral, _underlyingAsset));
    }

    function scaledBalanceOf(
        address account
    ) 
        public
        view
        returns (uint256)
    {
        return super.balanceOf(account);
    }

    function totalSupply() 
        public 
        view
        virtual
        override(ERC20, IERC20)
        returns (uint256)
    {
        uint256 currentScaledTotalSupply = super.totalSupply();
        if (currentScaledTotalSupply == 0) {
            return 0;
        }
        // address asset = ILendingPool(_lendingPool).getUnderlyingAsset(address(this));
        // uint256 liquidityIndex = ILendingPool(_lendingPool).getLiquidityIndex(asset);
        uint256 liquidityIndex = WadRayMath.ray();  
        return currentScaledTotalSupply.rayMul(liquidityIndex);
    }

    function scaledTotalSupply()
        public
        view
        returns (uint256)
    {
        return super.totalSupply();
    }


    function _transfer(
        address from,
        address to,
        uint256 amount
    )
        internal
        virtual
        override(ERC20)
    {
        // address asset = ILendingPool(_lendingPool).getUnderlyingAsset(address(this));
        uint256 liquidityIndex = _pool.getLiquidityIndex(_underlyingCollateral, _underlyingAsset);
        // uint256 liquidityIndex = WadRayMath.ray().mul(8); // as per test input

        super._transfer(from, to, amount.rayDiv(liquidityIndex));

        emit BalanceTransfer(from, to, amount, liquidityIndex);
    }

    function transferBalance(
        address from, 
        address to,
        uint256 amount
    ) public override {
        _transfer(from, to, amount);
    }

    /// @notice Pauses all contract functions.
    /// @dev Functions paused via Pausable contract modifier.
    function pause() external override onlyConfigurator {
        _pause();
    }

    /// @notice Unpauses all contract functions.
    /// @dev Functions unpaused via Pausable contract modifier.
    function unpause() external override onlyConfigurator{
        _unpause();
    }
}
