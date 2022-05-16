// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

interface IDebtToken is IERC20 {
    function mint(address account, uint256 amount, uint256 rate) external returns (bool);

    function burnFrom(address account, uint256 amount) external returns (bool);

    function burn(uint256 amount) external;

    function transfer(address asset, address to, uint256 amount) external;

    function pause() external;

    function unpause() external;

    function totalSupply() external view returns (uint256);
}