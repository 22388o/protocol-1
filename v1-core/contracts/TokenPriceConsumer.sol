// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol";
import "@chainlink/contracts/src/v0.8/Denominations.sol";

contract TokenPriceConsumer {
    FeedRegistryInterface internal registry;

    /**
     * Network: Ethereum Kovan
     * Feed Registry: 0xAa7F6f7f507457a1EE157fE97F6c7DB2BEec5cD0
     */
    constructor(address _registry) {
        registry = FeedRegistryInterface(_registry);
    }

    /**
     * Returns the ETH / USD price
     */
    function getEthUsdPrice() public view returns (uint256) {
        (
            uint80 roundID,
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = registry.latestRoundData(Denominations.ETH, Denominations.USD);
        return uint256(price);
    }

    /**
     * Returns the latest price
     */
    function getEthPrice(address quote) public view returns (uint256) {
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = registry.latestRoundData(Denominations.ETH, quote);
        return uint256(price);
    }

    /**
     * Returns the latest price
     */
    function getPrice(address base, address quote) public view returns (uint256) {
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = registry.latestRoundData(base, quote);
        return uint256(price);
    }
}