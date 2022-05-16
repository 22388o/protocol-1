// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import { LendingPoolStorage } from './LendingPoolStorage.sol';
import { IFToken } from "./interfaces/IFToken.sol";
import { IDebtToken } from "./interfaces/IDebtToken.sol";
import { ICollateralManager } from "./interfaces/ICollateralManager.sol";
import { INFTPriceConsumer } from "./interfaces/INFTPriceConsumer.sol";
import { ITokenPriceConsumer } from "./interfaces/ITokenPriceConsumer.sol";
import { MockOracle } from "./mocks/Oracle.sol";
import { NFTPriceConsumer } from "./NFTPriceConsumer.sol";
import { SafeMath } from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import { DataTypes } from "./libraries/DataTypes.sol";
import { ReserveLogic } from "./libraries/ReserveLogic.sol";
import "./WadRayMath.sol";
import "hardhat/console.sol";

/// @title Lending Pool Logic contract.
/// @author Niftrr
/// @notice Contains unprotected public view and internal Lending Pool functions.
/// @dev To help organize and limit size of Lending Pool contract.
contract LendingPoolLogic is LendingPoolStorage {
    using SafeMath for uint256;  
    using WadRayMath for uint256;
    using ReserveLogic for DataTypes.Reserve;

    /// @notice Get the Token Price Oracle contract address.
    /// @dev Uses a state variable.
    /// @return Returns the Token price oracle contract address.
    function getTokenPriceConsumerAddress() public view returns (address) {
        return _tokenPriceConsumerAddress;
    }

    /// @notice Get the NFT Price Oracle contract address.
    /// @dev Uses a state variable.
    /// @return Returns the Token price oracle contract address.
    function getNFTPriceConsumerAddress() public view returns (address) {
        return _nftPriceConsumerAddress;
    }

    /// @notice Get the Collateral Manager contract address.
    /// @dev Uses a state variable.
    /// @return Returns the Collateral Manager contract address.
    function getCollateralManagerAddress() public view returns (address) {
        return _collateralManagerAddress;
    }

    /// @notice Private function to calculate borrow variables.
    /// @param asset The ERC20 token to be borrowed.
    /// @param collateral The ERC721 token to be used as collateral.
    /// @dev Returns items in a fixed array and split from _borrow to save on space.
    /// @return InterestRate and collateralFloorPrice.
    function getBorrowVariables(
        address asset,
        address collateral
    )
        internal
        returns (uint256, uint256)
    {
        uint256 interestRate = ICollateralManager(
            _collateralManagerAddress
        ).getInterestRate(
            collateral,
            asset
        );

        uint256 collateralFloorPrice = INFTPriceConsumer(_nftPriceConsumerAddress).getFloorPrice(collateral);
        if (keccak256(abi.encodePacked(_assetNames[asset])) != keccak256(abi.encodePacked("WETH"))) {
            collateralFloorPrice = collateralFloorPrice.mul(ITokenPriceConsumer(_tokenPriceConsumerAddress).getEthPrice(asset));
        }
        return (interestRate, collateralFloorPrice);
    }

    function getLiquidityIndex(
        address collateral,
        address asset
    ) 
        public
        view
        returns (uint256)
    {
        DataTypes.Reserve memory reserve = _reserves[keccak256(abi.encode(collateral, asset))]; 
        return reserve.liquidityIndex;
    }

    function getUnderlyingAsset(
        address fToken
    )
        public 
        view
        returns (address)
    {
        return _underlyingAssets[fToken];
    }

    function getReserveNormalizedIncome(
        address collateral,
        address asset
    )
        public
        view
        returns (uint256)
    {
        DataTypes.Reserve storage reserve = _reserves[keccak256(abi.encode(collateral, asset))];
        (,uint256 normalizedIncome) = ReserveLogic.getNormalizedIncome(reserve);
        return normalizedIncome;
    }
    function _updateLiquidityIndex(
        address collateral,
        address asset
    )
        public // internal TODO: revert to internal
        returns (uint256)
    {
        DataTypes.Reserve storage reserve = _reserves[keccak256(abi.encode(collateral, asset))];
        (,reserve.liquidityIndex) = reserve.getNormalizedIncome();
        return reserve.liquidityIndex;
    }
}
