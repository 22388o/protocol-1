// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface ITokenPriceConsumer {
    function getEthUsdPrice() external returns (uint256);

    function getEthPrice(address quote) external returns (uint256);

    function getPrice(address base, address quote) external returns (uint256);
}