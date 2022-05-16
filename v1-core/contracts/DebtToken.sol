// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import { IDebtToken } from "./interfaces/IDebtToken.sol";
import { InterestLogic } from "./libraries/InterestLogic.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import { SafeMath } from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import "./WadRayMath.sol";

import "hardhat/console.sol";

/// @title DebtToken Contract for the NFTlend protocol.
/// @author Niftrr
/// @notice Allows for the tracking of debt for the purposes of APY calculations.
/// @dev Debt tokens are non-transferable and so diverge from the ERC20 standard.
contract DebtToken is Context, ERC20Pausable, IDebtToken, AccessControl, ReentrancyGuard {
    using SafeMath for uint256;
    using WadRayMath for uint256;

    bytes32 public constant CONFIGURATOR_ROLE = keccak256("CONFIGURATOR_ROLE");
    bytes32 public constant LENDING_POOL_ROLE = keccak256("LENDING_POOL_ROLE");

    mapping(address => uint256) internal _userAverageRate;
    mapping(address => uint40) internal _timestamps;
    uint256 internal _averageRate;
    uint40 internal _totalSupplyTimestamp;

    /// @notice Emitted when debtTokens are minted.
    /// @param to The recipient account.
    /// @param amount The amount of debtTokens to be minted.
    /// @param newBalance The newBalance of debtTokens.
    event Mint(address to, uint256 amount, uint256 newBalance);

    /// @notice Emitted when debtTokens are burned.
    /// @param account The account from which tokens are burned.
    /// @param amount The amount of debtTokens to be minted.
    event Burn(address account, uint256 amount);

    constructor(
        address configurator, 
        address lendingPool,
        string memory name, 
        string memory symbol
    ) 
        ERC20(name, symbol) 
    {
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

    struct mintDataLocalVars {
        uint256 previousSupply;
        uint256 currentAverageRate;
        uint256 nextSupply;
        uint256 newUserAverageRate;
    }

    /// @notice Mints an amount of debt tokens to a given account.
    /// @param to The account.
    /// @param amount The amount of debt tokens.
    /// @dev Calls the underlying ERC20 `_mint` function.
    /// @return Boolean for execution success.
    function mint(
        address to, 
        uint256 amount,
        uint256 rate
    ) 
        external 
        virtual 
        override 
        nonReentrant
        // onlyLendingPool TODO: reinstate
        whenNotPaused 
        returns (bool)
    {
        (, uint256 currentBalance, uint256 balanceIncrease) = _calculateBalanceIncrease(to);
        mintDataLocalVars memory vars;

        vars.previousSupply = totalSupply();
        vars.currentAverageRate = _averageRate;
        vars.nextSupply = vars.previousSupply.add(amount);

        vars.newUserAverageRate = (
            _userAverageRate[to]
            .rayMul(currentBalance.wadToRay())
            .add(amount.wadToRay().rayMul(rate))
        ).rayDiv(currentBalance.add(amount).wadToRay());

        _userAverageRate[to] = vars.newUserAverageRate;
        
        _totalSupplyTimestamp = _timestamps[to] = uint40(block.timestamp);

        // Calculates the updated average rate
        vars.currentAverageRate = _averageRate = 
            vars.currentAverageRate
            .rayMul(vars.previousSupply.wadToRay())
            .add(rate.rayMul(amount.wadToRay()))
            .rayDiv(vars.nextSupply.wadToRay());

        _mint(to, amount.add(balanceIncrease));

        emit Mint(to, amount, currentBalance.add(amount));

        return true;
    }

    /// @notice Burns an amount of debt tokens from a given account.
    /// @param account The account.
    /// @param amount The amount of debt tokens.
    /// @dev Calls the underlying ERC20 `_burn` function.
    /// @return Boolean for execution success.
    function burnFrom(
        address account,
        uint256 amount
    ) 
        public 
        virtual 
        override 
        nonReentrant
        // onlyLendingPool TODO: uncomment
        whenNotPaused 
        returns (bool)
    {
        (, uint256 currentBalance, uint256 balanceIncrease) = _calculateBalanceIncrease(account);
        uint256 previousSupply = totalSupply();
        uint256 nextSupply = 0;
        uint256 userAverageRate = _userAverageRate[account];
        uint256 newAverageRate = 0;

        // User debts and total supply accrue separately with potential accumulation errors
        // In the case that the last borrower tries to repay more than the available debt supply
        // set the amount to equal the remaining supply
        if (previousSupply <= amount) {
            _averageRate = 0;
        } else {
            nextSupply = previousSupply.sub(amount);
            uint256 firstTerm = _averageRate.rayMul(previousSupply.wadToRay());
            uint256 secondTerm = userAverageRate.rayMul(amount.wadToRay());

            // Similar to the above, when the last user is repaying it might happen that
            // user rate * user balance > average rate * total supply. 
            // In this case we set the average rate to zero.
            if (secondTerm > firstTerm) {
                newAverageRate = _averageRate = 0;
            } else {
                newAverageRate = _averageRate = firstTerm.sub(secondTerm).rayDiv(nextSupply.wadToRay());
            }
        }
        
        if (amount == currentBalance) {
            _userAverageRate[account] = 0;
            _timestamps[account] = 0;
        } else{
            _timestamps[account] = uint40(block.timestamp);
        }

        if (balanceIncrease > amount) {
            uint256 mintAmount = balanceIncrease.sub(amount);
            _mint(account, mintAmount);
            emit Mint(account, mintAmount, currentBalance.add(mintAmount));

        } else {
            uint256 burnAmount = amount.sub(balanceIncrease);
            _burn(account, burnAmount);
            emit Burn(account, burnAmount); //, currentBalance, balanceIncrease, newAverageRate, nextSupply
        }

        return true;
    }

    /// @notice Burn unsupported.
    /// @dev Overrides the ERC20 `burn` function to make unsupported.
    function burn(
        uint256 amount
    ) 
        public 
        virtual 
        override   
    {
        amount;
        revert('BURN_NOT_SUPPORTED');
    }

    /// @notice Approve unsupported.
    /// @dev Overrides the ERC20 `approve` function to make unsupported.
    /// @return Boolean for execution success.
    function approve(
        address spender, 
        uint256 amount
    ) 
        public 
        virtual 
        override (ERC20, IERC20)
        returns (bool) 
    {
        spender;
        amount;
        revert('APPROVE_NOT_SUPPORTED');
    }

    /// @notice Transfer unsupported.
    /// @dev Overrides the ERC20 `transfer` function to make unsupported.
    function transfer(
        address to, 
        address asset, 
        uint256 amount
    ) 
        public 
        virtual 
        override 
    {
        to;
        asset;
        amount;
        revert('TRANSFER_NOT_SUPPORTED');
    }

    /// @notice TransferFrom unsupported.
    /// @dev Overrides the ERC20 `transferFrom` function to make unsupported.
    /// @return Boolean for execution success.
    function transferFrom(
        address from, 
        address to, 
        uint256 amount
    ) 
        public 
        virtual 
        override (ERC20, IERC20)
        returns (bool) 
    {
        from;
        to;
        amount;
        revert('TRANSFER_NOT_SUPPORTED');
    }

    /// @notice Pauses all contract functions.
    /// @dev Functions paused via Pausable contract modifier.
    function pause() public virtual override onlyConfigurator {
        _pause();
    }

    /// @notice Unpauses all contract functions.
    /// @dev Functions unpaused via Pausable contract modifier.
    function unpause() public virtual override onlyConfigurator {
        _unpause();
    }

    function totalSupply() 
        public 
        view 
        override(ERC20, IDebtToken) 
        returns (uint256) 
    {
        return _calculateTotalSupply();
    }

    function balanceOf(address account)
        public
        view
        virtual
        override (ERC20, IERC20)
        returns (uint256) 
    {
        uint256 accountBalance = super.balanceOf(account);
        uint256 averageRate = _userAverageRate[account];
        if (accountBalance == 0) {
            return 0;
        }
        uint256 accumulatedInterest = 
            InterestLogic.calculateLinearInterest(averageRate, _timestamps[account]);
     
        return accountBalance.rayMul(accumulatedInterest);
    }

    function _calculateTotalSupply() 
        internal
        view
        virtual
        returns (uint256)
    {
        uint256 principalSupply = super.totalSupply();
        if (principalSupply == 0) {
            return 0;
        }
        
        uint256 accumulatedInterest = 
            InterestLogic.calculateLinearInterest(_averageRate, _totalSupplyTimestamp);
     
        return principalSupply.rayMul(accumulatedInterest);
    }

    function _calculateBalanceIncrease(address user)
        internal
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        uint256 previousPrincipalBalance = super.balanceOf(user);

        if (previousPrincipalBalance == 0) {
            return (0, 0, 0);
        }

        uint256 balanceIncrease = balanceOf(user).sub(previousPrincipalBalance);
        
        return (
            previousPrincipalBalance,
            previousPrincipalBalance.add(balanceIncrease),
            balanceIncrease
        );
    }
}
