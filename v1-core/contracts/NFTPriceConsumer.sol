// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import { SafeMath } from '@openzeppelin/contracts/utils/math/SafeMath.sol';

contract NFTPriceConsumer is AccessControl {
    using SafeMath for uint256;
    
    bytes32 internal constant CONFIGURATOR_ROLE = keccak256("CONFIGURATOR_ROLE");

    mapping(address => mapping(uint256 => uint256)) floorPrices;
    mapping(address => uint256) floorPrice;
    mapping(address => uint256) lastIndex;
    mapping(address => bool) initiated;
    bool updatedWindow = false;
    uint256 window = 10;

    event FloorPrice(address nftProject, uint256 floorPrice);

    constructor(
        address configurator, 
        uint256 _window
        ) 
    {
        _setupRole(CONFIGURATOR_ROLE, configurator);
        window = _window;
    }

    modifier onlyConfigurator() {
        require(hasRole(CONFIGURATOR_ROLE, _msgSender()), "NPO1");
        _;
    }

    function setFloorPrice(address _nftProject, uint256 _floorPrice) 
        public 
        onlyConfigurator 
    {
        if (lastIndex[_nftProject] < window) {
            floorPrices[_nftProject][lastIndex[_nftProject]] = _floorPrice;
        } else {
            initiated[_nftProject] = true;
            lastIndex[_nftProject] = 0;
            floorPrices[_nftProject][lastIndex[_nftProject]] = _floorPrice;
        }
        lastIndex[_nftProject] += 1;

        uint256 sum;
        for (uint256 i = 0; i < window; i++) {
            sum += floorPrices[_nftProject][i];
        }
        if (initiated[_nftProject]) {
            floorPrice[_nftProject] = sum.div(window);
        } else {
            floorPrice[_nftProject] = sum.div(lastIndex[_nftProject]);
        }
        
    }

    function getFloorPrice(address _nftProject) public view returns (uint256) {
        return floorPrice[_nftProject];
    }
}