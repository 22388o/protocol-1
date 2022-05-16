// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface ILendingPoolLiquidate {

    function liquidate(
        address collateral,
        address asset,
        uint256 borrowId
    ) external returns (bool);

}