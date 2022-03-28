// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { DataTypes } from "../libraries/DataTypes.sol";

interface ICollateralManager {

    function pause() external;

    function unpause() external;
   
    function deposit(
        address borrower,
        address erc20Token,
        address erc721Token, 
        uint256 tokenId, 
        uint256 borrowAmount,
        uint256 interestRate,
        uint256 liquidationPrice,
        uint40 timestamp
    ) 
        external 
        returns (bool success);

    function withdraw(
        uint256 _id, 
        address asset, 
        uint256 repaymentAmount
    ) 
        external
        returns (
            bool success,
            uint256 borrowAmount,
            uint256 interestRate
        );

    function retrieve(
        uint256 _id, 
        address asset, 
        uint256 repaymentAmount, 
        address liquidator
    ) 
        external
        returns (bool success);
    
    function setInterestRate(address _erc721Token, uint256 interestRate) external;

    function getInterestRate(address _erc721Token) external returns (uint256);
    
    function setLiquidationThreshold(address _erc721Token, uint256 _threshold) external;

    function updateWhitelist(address _erc721Token, bool isWhitelisted) external;

    function getLiquidationThreshold(address _erc721Token) external view;

    function getUserBorrowIds(address user) external view;

    function getBorrow(uint256 borrowId) external returns (DataTypes.Borrow memory);

    function setBorrowAuctionBid(
        uint256 borrowId,
        uint256 auctionBid,
        address auctionBidder
    ) 
        external
        returns (bool);

    function setBorrowAuctionCall(
        uint256 borrowId,
        uint256 auctionBid,
        uint256 auctionLiquidationFee,
        uint40 auctionTimestamp,
        address auctionCaller
    ) 
        external
        returns (bool);    

    function setBorrowStatus(
        uint256 borrowId,
        DataTypes.BorrowStatus status
    ) 
        external
        returns (bool);

    function updateBorrow(
        uint256 borrowId,
        uint256 borrowAmount,
        uint256 collateralFloorPrice,
        DataTypes.BorrowStatus status
    )
        external
        returns (bool);
}