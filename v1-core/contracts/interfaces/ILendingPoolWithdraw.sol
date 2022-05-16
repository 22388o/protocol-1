// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface ILendingPoolWithdraw {

    function withdraw(address collateral, address asset, uint256 amount) external returns (bool);

}