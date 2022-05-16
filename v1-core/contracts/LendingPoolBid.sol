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
import { ILendingPoolBid } from "./interfaces/ILendingPoolBid.sol";
import { INFTPriceConsumer } from "./interfaces/INFTPriceConsumer.sol";
import { ITokenPriceConsumer } from "./interfaces/ITokenPriceConsumer.sol";
import { SafeMath } from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import "./WadRayMath.sol";
import "hardhat/console.sol";

contract LendingPoolBid is Context, LendingPoolStorage, LendingPoolLogic, ILendingPoolBid, Pausable, AccessControl {
    using SafeMath for uint256; 
    using WadRayMath for uint256;

    bytes32 public constant CONFIGURATOR_ROLE = keccak256("CONFIGURATOR_ROLE");
    bytes32 public constant LENDING_POOL_ROLE = keccak256("LENDING_POOL_ROLE");

    struct BidVars {
        bool success;
        uint256 floorPrice;
        uint256 liquidationFee;
        uint256 borrowBalanceAmount;
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

    /// @notice Private function to bid on a defaultedborrow position.
    /// @param asset The ERC20 token to be borrowed.
    /// @param bidAmount The amount of ERC20 tokens to be bid / secured in the protocol.
    /// @param borrowId The unique identifier of the borrow.
    /// @dev Top bid amount held in protocol to cover defaulted borrow position. Previous bid returned. First bid triggers auction.
    function bid(
        address asset,
        uint256 bidAmount,
        uint256 borrowId
    ) 
        external
        // onlyLendingPool
        returns (bool)
    {
        DataTypes.Borrow memory borrowItem = ICollateralManager(
            _collateralManagerAddress
        ).getBorrow(borrowId);
        DataTypes.Reserve storage reserve = _reserves[keccak256(abi.encode(borrowItem.collateral.erc721Token, borrowItem.erc20Token))];  
        BidVars memory vars;

        require(asset == borrowItem.erc20Token, "INCORRECT_ASSET");
        require(reserve.status == DataTypes.ReserveStatus.Active, "Reserve is not active."); 

        vars.floorPrice = INFTPriceConsumer(_nftPriceConsumerAddress).getFloorPrice(borrowItem.collateral.erc721Token);
        if (keccak256(abi.encodePacked(_assetNames[asset])) != keccak256(abi.encodePacked("WETH"))) {
            vars.floorPrice = vars.floorPrice.mul(ITokenPriceConsumer(_tokenPriceConsumerAddress).getEthPrice(asset));
        }
        require(vars.floorPrice <= borrowItem.liquidationPrice, "BORROW_NOT_IN_DEFAULT");

        vars.liquidationFee = borrowItem.borrowAmount.rayMul(_liquidationFee);
        vars.borrowBalanceAmount = borrowItem.borrowAmount
            .add(
                (borrowItem.borrowAmount)
                .rayMul(borrowItem.interestRate)
                .mul(block.timestamp.sub(borrowItem.timestamp))
                .div(365 days)
            );

        if (borrowItem.status == DataTypes.BorrowStatus.Active) {
            require(bidAmount >= vars.borrowBalanceAmount, "INSUFFICIENT_BID");
        } else if (borrowItem.status == DataTypes.BorrowStatus.ActiveAuction) {
            require(uint40(block.timestamp) - borrowItem.auction.timestamp < 1 days, "AUCTION_ENDED"); // TODO: use configuratble global variable for auction time, currently 24 hours
            require(bidAmount > borrowItem.auction.bid, "INSUFFICIENT_BID");
        } else {
            revert("INACTIVE_BORROW");
        }
        
        vars.success = IERC20(asset).transferFrom(_msgSender(), reserve.fTokenAddress, bidAmount);
        require(vars.success, "UNSUCCESSFUL_TRANSFER");

        if (vars.success && borrowItem.status == DataTypes.BorrowStatus.ActiveAuction) {
            vars.success = IFToken(reserve.fTokenAddress).reserveTransfer(borrowItem.auction.bidder, asset, borrowItem.auction.bid);
            require(vars.success, "UNSUCCESSFUL_RESERVE_TRANSFER");
        }

        if (borrowItem.status == DataTypes.BorrowStatus.Active) {
            ICollateralManager( _collateralManagerAddress).setBorrowAuctionCall(
                borrowId, 
                bidAmount, 
                vars.liquidationFee,
                uint40(block.timestamp),
                _msgSender()
            );
        } else {
            ICollateralManager(_collateralManagerAddress).setBorrowAuctionBid(
                borrowId, 
                bidAmount, 
                _msgSender()
            );
        }

        return vars.success;
    }

}