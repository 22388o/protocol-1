// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface ILendingPoolBorrow {

    function borrow(
        address asset, 
        uint256 amount,
        address collateral,
        uint256 tokenId
    ) external returns (bool);

}