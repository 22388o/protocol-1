// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface ILendingPool {
    function initReserve(
        address collateral,
        address asset, 
        address fTokenAddress, 
        address debtTokenAddress,
        string calldata assetName
    ) 
        external;

    function deposit(address collateral, address asset, uint256 amount) external;

    function withdraw(address asset, uint256 amount) external;

    function borrow(
        address asset, 
        uint256 amount, 
        address collateral, 
        uint256 tokenId,
        uint256 numWeeks
    )
        external;

    function repay(
        address collateral, 
        address asset,
        uint256 repaymentAmount,
        uint256 borrowId
    ) 
        external;

    function liquidate(
        address asset,
        uint256 liquidationAmount, 
        uint256 borrowId
    ) 
        external;

    function getLiquidityIndex(
        address collateral,
        address asset
    )
        external 
        returns (uint256);

    function getUnderlyingAsset(
        address fToken
    )
        external 
        returns (address);

    function getReserveNormalizedIncome(
        address collateral,
        address asset
    )
        external 
        view
        returns (uint256);

    function pause() external;

    function unpause() external;

    function updateInterestFee(uint256 interestFee) external;

    function updateLiquidationFee(uint256 liquidationFee) external;

    function updateLiquidationFeeProtocolPercentage(uint256 protocolPercentage) external;

    function updateReserve(address collateral, address asset, bytes32 status) external;

    function connectContract(bytes32 contractName, address contractAddress) external;

    function getFloorPrice(address collateral, address asset) external returns (uint256);

    function getTokenPriceConsumerAddress() external view returns (address);

    function getFloorPriceMock(address collateral) external view returns (uint256);

    function getCollateralManagerAddress() external view returns (address);

    function setAuctionDuration(uint40 duration) external;

    function getAuctionDuration() external returns (uint40);

}