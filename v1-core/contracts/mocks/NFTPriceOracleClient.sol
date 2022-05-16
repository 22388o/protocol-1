// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

/**
 * Request testnet LINK and ETH here: https://faucets.chain.link/
 * Find information on LINK Token Contracts and get the latest ETH and LINK faucets here: https://docs.chain.link/docs/link-token-contracts/
 */

/**
 * THIS IS AN EXAMPLE CONTRACT WHICH USES HARDCODED VALUES FOR CLARITY.
 * PLEASE DO NOT USE THIS CODE IN PRODUCTION.
 */

contract NFTPriceConsumerClient is ChainlinkClient {
    using Chainlink for Chainlink.Request;
  
    uint256 public floorPrice;
    
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    
    event FloorPrice(uint256 floorPrice);
    
    /**
     * Network: Kovan
     * Oracle: 
     *      Name:           Chainlink DevRel - Kovan
     *      Address:        0xf4316Eb1584B3CF547E091Acd7003c116E07577b
     * Job: 
     *      Name:           Opensea Floor Price EA
     *      ID:             88724e5e72ac45559c2c8b11501ceff7
     *      Fee:            0.1 LINK
     */
    constructor() {
        setPublicChainlinkToken();
        oracle = 0xFe44dd625D1a076CAbe152c463a165c9C13a1efB;
        jobId = "88724e5e72ac45559c2c8b11501ceff7";
        fee = 0.1 * 10 ** 18; // (Varies by network and job)
    }

    /**
     * Initial request
     */
    function requestFloorPrice() public returns (bytes32 requestId) 
    {
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        request.add("id", "0");
        request.add("collection_slug", "doodles-official");
        return sendChainlinkRequestTo(oracle, request, fee);
    }

    /**
     * Callback function
     */
    function fulfill(bytes32 _requestId, uint256 _floorPrice) public recordChainlinkFulfillment(_requestId)
    {
        emit FloorPrice(floorPrice);
        floorPrice = _floorPrice;
        emit FloorPrice(floorPrice);
    }

    function getFloorPrice() public view returns (uint256) {
        return floorPrice;
    }

    // function withdrawLink() external {} - Implement a withdraw function to avoid locking your LINK in the contract
}
