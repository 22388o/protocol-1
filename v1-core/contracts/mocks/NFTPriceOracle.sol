// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// interface KeeperCompatibleInterface {
//     function checkUpkeep(bytes calldata checkData) external returns (bool upkeepNeeded, bytes memory performData);
//     function performUpkeep(bytes calldata performData) external;
// }

// contract NFTPriceConsumer is ChainlinkClient, KeeperCompatibleInterface {
    // using Chainlink for Chainlink.Request;
    // using Counters for Counters.Counter;

    // mapping(string => uint256) public floorPrice;
    // uint256 public lastTimeStamp;       
    // uint256 public interval;

    // mapping(uint256 => string) private nftProjectRequest;
    // address private oracle;
    // bytes32 private jobId;
    // uint256 private fee; 
    // Counters.Counter private counter;

    // event FloorPrice(string nftProject, uint256 floorPrice);

    // constructor(
    //     address _oracleAddress,
    //     string memory _jobId,
    //     uint256 _fee,
    //     uint256 _interval
    // ) {
    //   setPublicChainlinkToken();
    //   oracle = _oracleAddress; //0xFe44dd625D1a076CAbe152c463a165c9C13a1efB;
    //   jobId = _jobId; //"88724e5e72ac45559c2c8b11501ceff7";
    //   fee = _fee; //0.1 * 10 ** 18; // (Varies by network and job)
    //   interval = _interval; //300;
    //   lastTimeStamp = block.timestamp;
    // }

    // function checkUpkeep(bytes calldata checkData) external view override returns (bool upkeepNeeded, bytes memory performData) {
    //     upkeepNeeded = (block.timestamp - lastTimeStamp) > interval;
    //     performData = checkData;
    // }

    // function performUpkeep(bytes calldata performData) external override {
    //     lastTimeStamp = block.timestamp;
    //     requestFloorPrice("boredapeyachtclub");
    //     requestFloorPrice("doodles-official");
    //     performData;
    // }

    // /**
    //  * Initial request
    //  */
    // function requestFloorPrice(string calldata collection_slug) public returns (bytes32 requestId) 
    // {
    //     Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
    //     request.add("id", counter.current());
    //     request.add("collection_slug", collection_slug);

    //     nftProjectRequest[counter.current()] = collection_slug;
    //     counter.increment();
    //     return sendChainlinkRequestTo(oracle, request, fee);
    // }

    // /**
    //  * Callback function
    //  */
    // function fulfill(bytes32 _requestId, uint256 _floorPrice) public recordChainlinkFulfillment(_requestId)
    // {
    //     string memory nftProject = nftProjectRequest[_requestId];
    //     floorPrice[nftProject] = _floorPrice;
    //     emit FloorPrice(nftProject, _floorPrice);
    // }

    // function setInterval(uint256 _interval) public returns (bool) {
    //     interval = _interval;
    // }
// }