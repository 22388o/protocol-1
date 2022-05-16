// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import { SafeMath } from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import "hardhat/console.sol";

contract MockOracle {
    using SafeMath for uint256;  

    mapping(address => uint256) mockEthFloorPrices;
    mapping(address => uint256) ethTokenPrices;

    /// @notice Mocks getting the NFT floor price in terms of the asset provided (WIP)
    /// @param collateral The ERC721 token.
    /// @param asset The ERC20 token with which to price the collateral.
    /// @dev This is a placeholder used for dev / demos until the oracles are connected.
    /// @return Returns the floorPrice of the NFT project in terms of the asset provided. 
    function getMockFloorPrice(address collateral, address asset) public view returns (uint256) {
        uint256 floorPriceEth = mockEthFloorPrices[collateral];
        require(floorPriceEth > 0, "UNSET_MOCK_FLOORPRICE"); 

        // uint256 ethTokenPrice = ethTokenPrices[asset]; // TODO: create a new / hybrid function for other ccys
        // require(ethTokenPrice > 0, "UNSET_MOCK_TOKENPRICE"); 

        // uint256 ethTokenPriceDecimal = 1000000000000000000; // 18d TODO: connect Token Price Oracle 
        // uint256 floorPrice = floorPriceEth.mul(ethTokenPrice).div(ethTokenPriceDecimal);
        return floorPriceEth;
    }

    /// @notice Mocks an oracle setting the NFT floor price in terms of ETH (WIP)
    /// @param collateral The ERC721 token.
    /// @param floorPrice The floor price to set.
    /// @dev This is a placeholder used for dev / demos until the oracles are connected. 
    function setMockFloorPrice(address collateral, uint256 floorPrice) external {
        mockEthFloorPrices[collateral] = floorPrice;
    }

    /// @notice Mocks an oracle price feed to set the ETH/ASSET price
    /// @param asset The ERC20 token.
    /// @param price The ETH/ERC20 asset price.
    /// @dev This is a placeholder used for dev / demos until the oracles are connected.
    function setMockEthTokenPrice(address asset, uint256 price) public {
        ethTokenPrices[asset] = price;
    }
}