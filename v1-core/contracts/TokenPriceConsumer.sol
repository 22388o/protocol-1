// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol";
import "@chainlink/contracts/src/v0.8/Denominations.sol";

contract TokenPriceConsumer {
    FeedRegistryInterface internal registry;

    /**
     * Network: Ethereum Mainnet / Kovan
     * Feed Registry: 0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf / 0xAa7F6f7f507457a1EE157fE97F6c7DB2BEec5cD0
     */
    constructor(address _registry) {
        registry = FeedRegistryInterface(_registry);
    }

    /**
     * Returns the mock ETH / USD price
     */
    function getMockEthUsdPrice() public view returns (uint256) {
        int price = 2826960000000000000000; // 2,826.96 * 10**18
        return uint256(price);
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