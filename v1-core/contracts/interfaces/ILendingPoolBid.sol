// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface ILendingPoolBid {

    function bid(
        address asset, 
        uint256 bidAmount,
        uint256 borrowId
    ) external returns (bool);

}